import type { Algo } from "./algorithms";

export type Digests = Record<Algo, string>;

export type WorkerRequest =
  | { type: "hash"; id: string; file: File }
  | { type: "cancel"; id: string };

export type WorkerResponse =
  | { type: "progress"; id: string; bytesRead: number }
  | { type: "done"; id: string; hashes: Digests; ms: number }
  | { type: "cancelled"; id: string }
  | { type: "error"; id: string; message: string };
