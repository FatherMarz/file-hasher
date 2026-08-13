import { useState } from "react";
import { formatBytes, formatRate, shortHash } from "../lib/format";
import { copy } from "../lib/export";
import type { Row } from "../lib/export";
import { useHashStore } from "../stores/hashStore";

const MARK: Record<string, { glyph: string; className: string; label: string }> = {
  match: { glyph: "✓", className: "text-ok", label: "Matches the expected hash" },
  mismatch: { glyph: "✗", className: "text-bad", label: "Does not match" },
  none: { glyph: "·", className: "text-text-muted", label: "Nothing to compare" },
};

function CopyButton({ hash }: { hash: string }) {
  const [hit, setHit] = useState(false);
  return (
    <button
      className="btn shrink-0 px-2 py-1 text-xs"
      onClick={async () => {
        if (await copy(hash)) {
          setHit(true);
          setTimeout(() => setHit(false), 1200);
        }
      }}
    >
      {hit ? "copied" : "copy"}
    </button>
  );
}

function ResultRow({ row, duplicate }: { row: Row; duplicate: boolean }) {
  const cancel = useHashStore((s) => s.cancel);
  const remove = useHashStore((s) => s.remove);
  const e = row.entry;
  const mark = MARK[row.state];
  const pct = e.size > 0 ? Math.round((e.bytesRead / e.size) * 100) : 100;

  return (
    <li className="flex items-start gap-3 border-b border-border px-3 py-2 last:border-b-0">
      <span
        className={`mt-0.5 w-4 shrink-0 text-center ${mark.className}`}
        title={mark.label}
        aria-label={mark.label}
      >
        {e.status === "done" ? mark.glyph : "⋯"}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="break-all text-sm">{e.path}</span>
          <span className="text-xs text-text-muted">{formatBytes(e.size)}</span>
          {duplicate && (
            <span className="rounded border border-border px-1 text-xs text-text-muted">
              duplicate
            </span>
          )}
        </div>

        {e.status === "done" && e.hash && (
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <span className="break-all font-mono text-xs text-text-muted">{e.hash}</span>
            {e.ms > 250 && (
              <span className="text-xs text-text-muted">
                {formatRate(e.size, e.ms)}
              </span>
            )}
          </div>
        )}

        {row.state === "mismatch" && row.want && (
          <div className="mt-0.5 break-all font-mono text-xs text-bad">
            expected {shortHash(row.want)}
          </div>
        )}

        {(e.status === "queued" || e.status === "hashing") && (
          <div className="mt-1 flex items-center gap-2">
            <div
              className="h-1 w-full max-w-xs overflow-hidden rounded bg-surface-alt"
              role="progressbar"
              aria-valuenow={pct}
            >
              <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs tabular-nums text-text-muted">{pct}%</span>
          </div>
        )}

        {e.status === "cancelled" && (
          <div className="mt-0.5 text-xs text-text-muted">Cancelled.</div>
        )}

        {e.status === "error" && (
          <div className="mt-0.5 text-xs text-bad">{e.error}</div>
        )}
      </div>

      {e.status === "hashing" || e.status === "queued" ? (
        <button className="btn shrink-0 px-2 py-1 text-xs" onClick={() => cancel(e.id)}>
          cancel
        </button>
      ) : e.hash ? (
        <CopyButton hash={e.hash} />
      ) : (
        <button className="btn shrink-0 px-2 py-1 text-xs" onClick={() => remove(e.id)}>
          remove
        </button>
      )}
    </li>
  );
}

export function Results({
  rows,
  duplicates,
}: {
  rows: Row[];
  duplicates: Set<string>;
}) {
  if (rows.length === 0) return null;
  return (
    <ul className="card divide-border">
      {rows.map((row) => (
        <ResultRow
          key={row.entry.id}
          row={row}
          duplicate={!!row.entry.hash && duplicates.has(row.entry.hash)}
        />
      ))}
    </ul>
  );
}
