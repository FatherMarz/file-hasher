import { create } from "zustand";
import { DEFAULT_ALGO, type Algo } from "../lib/algorithms";
import { HashPool } from "../lib/pool";

export type Status = "queued" | "hashing" | "done" | "cancelled" | "error";

export type Entry = {
  id: string;
  /** Full relative path when a folder was dropped, otherwise the file name. */
  path: string;
  name: string;
  size: number;
  file: File;
  status: Status;
  bytesRead: number;
  hash: string | null;
  ms: number;
  error: string | null;
};

type State = {
  entries: Entry[];
  algo: Algo;
  expectedText: string;
  /** Set when a pasted hash forced the algorithm to change. */
  algoNote: string | null;
  addFiles: (picked: { file: File; path: string }[]) => void;
  setAlgo: (algo: Algo, note?: string) => void;
  setExpectedText: (text: string) => void;
  dismissNote: () => void;
  cancel: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

let pool: HashPool | null = null;
let seq = 0;

function getPool(): HashPool {
  if (pool) return pool;
  pool = new HashPool({
    onProgress: (id, bytesRead) =>
      patch(id, (e) => ({ ...e, status: "hashing", bytesRead })),
    onDone: (id, hash, ms) =>
      patch(id, (e) => ({ ...e, status: "done", hash, ms, bytesRead: e.size })),
    onCancelled: (id) =>
      patch(id, (e) => ({ ...e, status: "cancelled", bytesRead: 0, hash: null })),
    onError: (id, message) =>
      patch(id, (e) => ({ ...e, status: "error", error: message, hash: null })),
  });
  return pool;
}

function patch(id: string, fn: (e: Entry) => Entry) {
  useHashStore.setState((s) => {
    const i = s.entries.findIndex((e) => e.id === id);
    if (i < 0) return s;
    const next = s.entries.slice();
    next[i] = fn(next[i]);
    return { entries: next };
  });
}

export const useHashStore = create<State>((set, get) => ({
  entries: [],
  algo: DEFAULT_ALGO,
  expectedText: "",
  algoNote: null,

  addFiles: (picked) => {
    if (picked.length === 0) return;
    const algo = get().algo;
    const added: Entry[] = picked.map(({ file, path }) => ({
      id: `f${seq++}`,
      path,
      name: file.name || path,
      size: file.size,
      file,
      status: "queued",
      bytesRead: 0,
      hash: null,
      ms: 0,
      error: null,
    }));
    set((s) => ({ entries: [...s.entries, ...added] }));
    for (const e of added) getPool().submit({ id: e.id, file: e.file, algo });
  },

  setAlgo: (algo, note) => {
    if (algo === get().algo) {
      if (note) set({ algoNote: note });
      return;
    }
    getPool().cancelAll();
    set((s) => ({
      algo,
      algoNote: note ?? null,
      entries: s.entries.map((e) => ({
        ...e,
        status: "queued",
        bytesRead: 0,
        hash: null,
        ms: 0,
        error: null,
      })),
    }));
    for (const e of get().entries) getPool().submit({ id: e.id, file: e.file, algo });
  },

  setExpectedText: (expectedText) => set({ expectedText }),

  dismissNote: () => set({ algoNote: null }),

  cancel: (id) => getPool().cancel(id),

  remove: (id) => {
    getPool().cancel(id);
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
  },

  clear: () => {
    getPool().cancelAll();
    set({ entries: [], expectedText: "", algoNote: null });
  },
}));

/** Hashes that more than one file produced. */
export function duplicateHashes(entries: Entry[]): Set<string> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const e of entries) {
    if (!e.hash) continue;
    if (seen.has(e.hash)) dupes.add(e.hash);
    seen.add(e.hash);
  }
  return dupes;
}
