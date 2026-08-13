import type { Algo } from "./algorithms";

export type WorkerRequest =
  | { type: "hash"; id: string; file: File; algo: Algo }
  | { type: "cancel"; id: string };

export type WorkerResponse =
  | { type: "progress"; id: string; bytesRead: number }
  | { type: "done"; id: string; hash: string; ms: number }
  | { type: "cancelled"; id: string }
  | { type: "error"; id: string; message: string };
