import { create } from "zustand";
import { HashPool } from "../lib/pool";
import type { Digests } from "../lib/protocol";

export type Status = "queued" | "hashing" | "done" | "cancelled" | "error";

/** Which half of the input panel is showing. */
export type InputMode = "files" | "expected";

export type Entry = {
  id: string;
  /** Full relative path when a folder was dropped, otherwise the file name. */
  path: string;
  name: string;
  size: number;
  file: File;
  status: Status;
  bytesRead: number;
  hashes: Digests | null;
  ms: number;
  error: string | null;
};

type State = {
  entries: Entry[];
  expectedText: string;
  inputMode: InputMode;
  openIds: Set<string>;
  addFiles: (picked: { file: File; path: string }[]) => void;
  setExpectedText: (text: string) => void;
  setInputMode: (mode: InputMode) => void;
  toggleOpen: (id: string) => void;
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
    onDone: (id, hashes, ms) =>
      patch(id, (e) => ({ ...e, status: "done", hashes, ms, bytesRead: e.size })),
    onCancelled: (id) =>
      patch(id, (e) => ({ ...e, status: "cancelled", bytesRead: 0, hashes: null })),
    onError: (id, message) =>
      patch(id, (e) => ({ ...e, status: "error", error: message, hashes: null })),
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

export const useHashStore = create<State>((set) => ({
  entries: [],
  expectedText: "",
  inputMode: "files",
  openIds: new Set(),

  addFiles: (picked) => {
    if (picked.length === 0) return;
    const added: Entry[] = picked.map(({ file, path }) => ({
      id: `f${seq++}`,
      path,
      name: file.name || path,
      size: file.size,
      file,
      status: "queued",
      bytesRead: 0,
      hashes: null,
      ms: 0,
      error: null,
    }));
    set((s) => ({ entries: [...s.entries, ...added] }));
    for (const e of added) getPool().submit({ id: e.id, file: e.file });
  },

  setExpectedText: (expectedText) => set({ expectedText }),

  setInputMode: (inputMode) => set({ inputMode }),

  toggleOpen: (id) =>
    set((s) => {
      const next = new Set(s.openIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { openIds: next };
    }),

  cancel: (id) => getPool().cancel(id),

  remove: (id) => {
    getPool().cancel(id);
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
  },

  clear: () => {
    getPool().cancelAll();
    set({ entries: [], openIds: new Set() });
  },
}));

/** SHA-256 values that more than one file produced. */
export function duplicateHashes(entries: Entry[]): Set<string> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const e of entries) {
    const h = e.hashes?.sha256;
    if (!h) continue;
    if (seen.has(h)) dupes.add(h);
    seen.add(h);
  }
  return dupes;
}
