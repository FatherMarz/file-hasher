import { ALGO_META, type Algo } from "./algorithms";
import type { Entry } from "../stores/hashStore";
import type { MatchState } from "./expected";

export type Row = { entry: Entry; state: MatchState; want: string | null };

const done = (rows: Row[]) => rows.filter((r) => r.entry.hash);

/** The `sha256sum` output format, so the text pastes straight into `-c`. */
export function toText(rows: Row[]): string {
  return done(rows)
    .map((r) => `${r.entry.hash}  ${r.entry.path}`)
    .join("\n");
}

export function toCsv(rows: Row[], algo: Algo): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = ["path", "size_bytes", ALGO_META[algo].ext, "expected", "result"];
  const body = done(rows).map((r) =>
    [
      esc(r.entry.path),
      String(r.entry.size),
      r.entry.hash ?? "",
      r.want ?? "",
      r.state === "none" ? "" : r.state,
    ].join(","),
  );
  return [head.join(","), ...body].join("\n");
}

export function toJson(rows: Row[], algo: Algo): string {
  return JSON.stringify(
    {
      algorithm: ALGO_META[algo].ext,
      files: done(rows).map((r) => ({
        path: r.entry.path,
        size: r.entry.size,
        hash: r.entry.hash,
        expected: r.want,
        result: r.state === "none" ? null : r.state,
      })),
    },
    null,
    2,
  );
}

export function download(name: string, body: string, mime: string) {
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard access needs a secure context and a user gesture. A hidden textarea
    // still works where it does not.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}
