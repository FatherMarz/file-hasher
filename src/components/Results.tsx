import { ALGOS, ALGO_META, DEFAULT_ALGO } from "../lib/algorithms";
import type { Row } from "../lib/export";
import { formatBytes } from "../lib/format";
import { useHashStore } from "../stores/hashStore";
import { CopyIcon } from "./CopyIcon";

const MARK: Record<string, { glyph: string; className: string; label: string }> = {
  match: { glyph: "✓", className: "text-ok", label: "Matches the expected hash" },
  mismatch: { glyph: "✗", className: "text-bad", label: "Does not match" },
  none: { glyph: "·", className: "text-text-muted", label: "Nothing to compare" },
};

/** Every row is this tall, open or closed, so the list never jumps. */
const LINE = "flex h-9 items-center gap-2 px-3";

function Line({ row }: { row: Row }) {
  const toggleOpen = useHashStore((s) => s.toggleOpen);
  const open = useHashStore((s) => s.openIds.has(row.entry.id));
  const cancel = useHashStore((s) => s.cancel);
  const remove = useHashStore((s) => s.remove);

  const e = row.entry;
  const mark = MARK[row.state];
  const running = e.status === "queued" || e.status === "hashing";
  const pct = e.size > 0 ? Math.round((e.bytesRead / e.size) * 100) : 100;
  const hash = e.hashes?.[DEFAULT_ALGO] ?? null;

  return (
    <div
      className={`${LINE} ${e.hashes ? "cursor-pointer" : ""} hover:bg-surface-alt/60`}
      onClick={() => e.hashes && toggleOpen(e.id)}
    >
      <span
        className={`w-3 shrink-0 text-center ${mark.className}`}
        title={mark.label}
        aria-label={mark.label}
      >
        {e.status === "done" ? mark.glyph : "·"}
      </span>

      <span className="w-4 shrink-0 text-center text-xs text-text-muted">
        {e.hashes ? (open ? "▾" : "▸") : ""}
      </span>

      <span className="min-w-0 flex-1 truncate text-sm" title={e.path}>
        {e.path}
      </span>
      <CopyIcon value={e.path} label="file name" />

      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-text-muted">
        {formatBytes(e.size)}
      </span>

      {running ? (
        <>
          <span className="hidden w-40 shrink-0 sm:block">
            <span className="block h-1 overflow-hidden rounded bg-surface-alt">
              <span className="block h-full bg-accent" style={{ width: `${pct}%` }} />
            </span>
          </span>
          <span className="w-9 shrink-0 text-right text-xs tabular-nums text-text-muted">
            {pct}%
          </span>
          <button
            className="btn shrink-0 px-1.5 py-0.5 text-xs"
            onClick={(ev) => {
              ev.stopPropagation();
              cancel(e.id);
            }}
          >
            stop
          </button>
        </>
      ) : hash ? (
        <>
          <span
            className="hidden w-52 shrink-0 truncate font-mono text-xs text-text-muted sm:block"
            title={hash}
          >
            {hash}
          </span>
          <CopyIcon value={hash} label="SHA-256" />
        </>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-xs text-text-muted">
            {e.status === "cancelled" ? "Cancelled." : e.error}
          </span>
          <button
            className="btn shrink-0 px-1.5 py-0.5 text-xs"
            onClick={(ev) => {
              ev.stopPropagation();
              remove(e.id);
            }}
          >
            remove
          </button>
        </>
      )}
    </div>
  );
}

function Detail({ row }: { row: Row }) {
  const e = row.entry;
  if (!e.hashes) return null;

  return (
    <div className="border-t border-border/60 bg-bg/40 py-1">
      {ALGOS.map((algo) => {
        const value = e.hashes![algo];
        const hit = row.want === value;
        return (
          <div key={algo} className={LINE}>
            <span className="w-3 shrink-0" />
            <span className="w-4 shrink-0" />
            <span className="w-20 shrink-0 text-xs text-text-muted">
              {ALGO_META[algo].label}
            </span>
            <span
              className={`min-w-0 flex-1 truncate font-mono text-xs ${
                hit ? "text-ok" : "text-text"
              }`}
              title={value}
            >
              {value}
            </span>
            {ALGO_META[algo].weak && (
              <span className="shrink-0 text-xs text-text-muted">weak</span>
            )}
            <CopyIcon value={value} label={ALGO_META[algo].label} />
          </div>
        );
      })}
    </div>
  );
}

export function Results({ rows, duplicates }: { rows: Row[]; duplicates: Set<string> }) {
  const open = useHashStore((s) => s.openIds);

  return (
    <section
      className="card h-[22rem] overflow-y-auto"
      aria-label="Results"
    >
      {rows.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-text-muted">
          Results show up here.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.entry.id}>
              <Line row={row} />
              {duplicates.has(row.entry.hashes?.sha256 ?? "") && (
                <div className={`${LINE} border-t border-border/60 text-xs text-text-muted`}>
                  <span className="w-3 shrink-0" />
                  <span className="w-4 shrink-0" />
                  <span>Another file in this list holds the same bytes.</span>
                </div>
              )}
              {open.has(row.entry.id) && <Detail row={row} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
