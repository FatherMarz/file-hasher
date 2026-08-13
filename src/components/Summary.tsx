import { useState } from "react";
import { copy, download, toCsv, toJson, toText, type Row } from "../lib/export";
import { formatBytes } from "../lib/format";
import { useHashStore } from "../stores/hashStore";

export function Summary({ rows }: { rows: Row[] }) {
  const clear = useHashStore((s) => s.clear);
  const [copied, setCopied] = useState(false);

  const bytes = rows.reduce((n, r) => n + r.entry.size, 0);
  const finished = rows.filter((r) => r.entry.hashes).length;
  const matches = rows.filter((r) => r.state === "match").length;
  const misses = rows.filter((r) => r.state === "mismatch").length;

  const counts =
    rows.length === 0
      ? "No files yet"
      : [
          `${rows.length} ${rows.length === 1 ? "file" : "files"}`,
          formatBytes(bytes),
          matches > 0 ? `${matches} match` : null,
          misses > 0 ? `${misses} no match` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <section className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-text-muted">{counts}</p>

      <div className="flex flex-wrap gap-2">
        <button
          className="btn"
          disabled={finished === 0}
          onClick={async () => {
            if (await copy(toText(rows))) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }
          }}
        >
          {copied ? "copied" : "copy all"}
        </button>
        <button
          className="btn"
          disabled={finished === 0}
          onClick={() => download("sha256sums.txt", toText(rows), "text/plain")}
        >
          .txt
        </button>
        <button
          className="btn"
          disabled={finished === 0}
          onClick={() => download("hashes.csv", toCsv(rows), "text/csv")}
        >
          .csv
        </button>
        <button
          className="btn"
          disabled={finished === 0}
          onClick={() => download("hashes.json", toJson(rows), "application/json")}
        >
          .json
        </button>
        <button className="btn" disabled={rows.length === 0} onClick={clear}>
          clear
        </button>
      </div>
    </section>
  );
}
