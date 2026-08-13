/// <reference lib="webworker" />
import {
  createMD5,
  createSHA1,
  createSHA256,
  createSHA384,
  createSHA512,
  type IHasher,
} from "hash-wasm";
import { ALGOS, type Algo } from "../lib/algorithms";
import type { Digests, WorkerRequest, WorkerResponse } from "../lib/protocol";

/** 8 MiB. Big enough that the per-chunk overhead disappears, small enough that a
 *  cancel lands quickly and the tab never holds much of a large file at once. */
const CHUNK = 8 * 1024 * 1024;
const PROGRESS_MS = 120;

const FACTORIES: Record<Algo, () => Promise<IHasher>> = {
  sha256: createSHA256,
  sha1: createSHA1,
  sha384: createSHA384,
  sha512: createSHA512,
  md5: createMD5,
};

/** WASM instances are expensive to build and safe to reuse after init(). Every
 *  algorithm runs against the same chunk, so a file is read from disk exactly once. */
const hashers = new Map<Algo, IHasher>();

async function getHashers(): Promise<Record<Algo, IHasher>> {
  const out = {} as Record<Algo, IHasher>;
  for (const algo of ALGOS) {
    let h = hashers.get(algo);
    if (!h) {
      h = await FACTORIES[algo]();
      hashers.set(algo, h);
    }
    h.init();
    out[algo] = h;
  }
  return out;
}

const cancelled = new Set<string>();

function post(msg: WorkerResponse) {
  self.postMessage(msg);
}

async function run(id: string, file: File) {
  const started = performance.now();
  const active = await getHashers();

  let offset = 0;
  let lastPost = 0;

  while (offset < file.size) {
    if (cancelled.has(id)) {
      cancelled.delete(id);
      post({ type: "cancelled", id });
      return;
    }

    const end = Math.min(offset + CHUNK, file.size);
    const bytes = new Uint8Array(await file.slice(offset, end).arrayBuffer());
    for (const algo of ALGOS) active[algo].update(bytes);
    offset = end;

    const now = performance.now();
    if (now - lastPost > PROGRESS_MS || offset === file.size) {
      lastPost = now;
      post({ type: "progress", id, bytesRead: offset });
    }
  }

  const hashes = {} as Digests;
  for (const algo of ALGOS) hashes[algo] = active[algo].digest("hex") as string;

  post({ type: "done", id, hashes, ms: performance.now() - started });
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;

  if (msg.type === "cancel") {
    cancelled.add(msg.id);
    return;
  }

  try {
    await run(msg.id, msg.file);
  } catch (err) {
    post({
      type: "error",
      id: msg.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
