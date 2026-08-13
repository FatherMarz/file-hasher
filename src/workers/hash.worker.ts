/// <reference lib="webworker" />
import {
  createMD5,
  createSHA1,
  createSHA256,
  createSHA384,
  createSHA512,
  type IHasher,
} from "hash-wasm";
import type { Algo } from "../lib/algorithms";
import type { WorkerRequest, WorkerResponse } from "../lib/protocol";

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

/** WASM instances are expensive to build and safe to reuse after init(). */
const hashers = new Map<Algo, IHasher>();

async function getHasher(algo: Algo): Promise<IHasher> {
  let h = hashers.get(algo);
  if (!h) {
    h = await FACTORIES[algo]();
    hashers.set(algo, h);
  }
  h.init();
  return h;
}

const cancelled = new Set<string>();

function post(msg: WorkerResponse) {
  self.postMessage(msg);
}

async function run(id: string, file: File, algo: Algo) {
  const started = performance.now();
  const hasher = await getHasher(algo);

  let offset = 0;
  let lastPost = 0;

  while (offset < file.size) {
    if (cancelled.has(id)) {
      cancelled.delete(id);
      post({ type: "cancelled", id });
      return;
    }

    const end = Math.min(offset + CHUNK, file.size);
    const buf = await file.slice(offset, end).arrayBuffer();
    hasher.update(new Uint8Array(buf));
    offset = end;

    const now = performance.now();
    if (now - lastPost > PROGRESS_MS || offset === file.size) {
      lastPost = now;
      post({ type: "progress", id, bytesRead: offset });
    }
  }

  post({
    type: "done",
    id,
    hash: hasher.digest("hex") as string,
    ms: performance.now() - started,
  });
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;

  if (msg.type === "cancel") {
    cancelled.add(msg.id);
    return;
  }

  try {
    await run(msg.id, msg.file, msg.algo);
  } catch (err) {
    post({
      type: "error",
      id: msg.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
