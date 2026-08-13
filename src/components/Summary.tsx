import { useState } from "react";
import { ALGO_META } from "../lib/algorithms";
import { copy, download, toCsv, toJson, toText, type Row } from "../lib/export";
import { formatBytes } from "../lib/format";
import { useHashStore } from "../stores/hashStore";

export function Summary({ rows }: { rows: Row[] }) {
  const algo = useHashStore((s) => s.algo);
  const clear = useHashStore((s) => s.clear);
  const [copied, setCopied] = useState(false);

  if (rows.length === 0) return null;

  const bytes = rows.reduce((n, r) => n + r.entry.size, 0);
  const finished = rows.filter((r) => r.entry.hash).length;
  const matches = rows.filter((r) => r.state === "match").length;
  const misses = rows.filter((r) => r.state === "mismatch").length;
  const ext = ALGO_META[algo].ext;

  const counts = [
    `${rows.length} ${rows.length === 1 ? "file" : "files"}`,
    formatBytes(bytes),
    matches > 0 ? `${matches} match` : null,
    misses > 0 ? `${misses} no match` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 pt-1">
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
          onClick={() => download(`${ext}sums.txt`, toText(rows), "text/plain")}
        >
          .txt
        </button>
        <button
          className="btn"
          disabled={finished === 0}
          onClick={() => download(`${ext}sums.csv`, toCsv(rows, algo), "text/csv")}
        >
          .csv
        </button>
        <button
          className="btn"
          disabled={finished === 0}
          onClick={() =>
            download(`${ext}sums.json`, toJson(rows, algo), "application/json")
          }
        >
          .json
        </button>
        <button className="btn" onClick={clear}>
          clear
        </button>
      </div>
    </section>
  );
}
