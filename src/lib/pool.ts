import type { Algo } from "./algorithms";
import type { WorkerRequest, WorkerResponse } from "./protocol";

export type PoolHandlers = {
  onProgress: (id: string, bytesRead: number) => void;
  onDone: (id: string, hash: string, ms: number) => void;
  onCancelled: (id: string) => void;
  onError: (id: string, message: string) => void;
};

type Job = { id: string; file: File; algo: Algo };

/**
 * One worker per core, minus one so the UI thread keeps a core to itself. Each worker
 * holds a single job at a time, which is what makes cancel simple: the worker checks
 * its cancel set between chunks.
 */
const SIZE = Math.max(1, Math.min(8, (navigator.hardwareConcurrency || 4) - 1));

export class HashPool {
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private busy = new Map<Worker, string>();
  private queue: Job[] = [];
  private handlers: PoolHandlers;

  constructor(handlers: PoolHandlers) {
    this.handlers = handlers;
    for (let i = 0; i < SIZE; i++) {
      const w = new Worker(new URL("../workers/hash.worker.ts", import.meta.url), {
        type: "module",
      });
      w.onmessage = (e: MessageEvent<WorkerResponse>) => this.receive(w, e.data);
      this.workers.push(w);
      this.idle.push(w);
    }
  }

  submit(job: Job) {
    this.queue.push(job);
    this.pump();
  }

  /** Drops a queued job, or tells the worker holding it to stop between chunks. */
  cancel(id: string) {
    const queuedAt = this.queue.findIndex((j) => j.id === id);
    if (queuedAt >= 0) {
      this.queue.splice(queuedAt, 1);
      this.handlers.onCancelled(id);
      return;
    }
    for (const [w, runningId] of this.busy) {
      if (runningId === id) {
        this.send(w, { type: "cancel", id });
        return;
      }
    }
  }

  cancelAll() {
    for (const job of this.queue.splice(0)) this.handlers.onCancelled(job.id);
    for (const [w, id] of this.busy) this.send(w, { type: "cancel", id });
  }

  destroy() {
    for (const w of this.workers) w.terminate();
    this.workers = [];
    this.idle = [];
    this.busy.clear();
    this.queue = [];
  }

  private send(w: Worker, msg: WorkerRequest) {
    w.postMessage(msg);
  }

  private pump() {
    while (this.queue.length > 0 && this.idle.length > 0) {
      const w = this.idle.pop()!;
      const job = this.queue.shift()!;
      this.busy.set(w, job.id);
      this.send(w, { type: "hash", id: job.id, file: job.file, algo: job.algo });
    }
  }

  private release(w: Worker) {
    this.busy.delete(w);
    this.idle.push(w);
    this.pump();
  }

  private receive(w: Worker, msg: WorkerResponse) {
    switch (msg.type) {
      case "progress":
        this.handlers.onProgress(msg.id, msg.bytesRead);
        return;
      case "done":
        this.release(w);
        this.handlers.onDone(msg.id, msg.hash, msg.ms);
        return;
      case "cancelled":
        this.release(w);
        this.handlers.onCancelled(msg.id);
        return;
      case "error":
        this.release(w);
        this.handlers.onError(msg.id, msg.message);
        return;
    }
  }
}
