import { ALGOS, ALGO_META, isAlgo } from "../lib/algorithms";
import { useHashStore } from "../stores/hashStore";

export function Header() {
  const algo = useHashStore((s) => s.algo);
  const setAlgo = useHashStore((s) => s.setAlgo);

  return (
    <header className="flex flex-wrap items-end justify-between gap-3 pb-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">File Hasher</h1>
        <p className="mt-1 text-sm text-text-muted">
          Nothing leaves your computer.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-text-muted">Algorithm</span>
        <select
          value={algo}
          aria-label="Hash algorithm"
          onChange={(e) => {
            if (isAlgo(e.target.value)) setAlgo(e.target.value);
          }}
          className="rounded-md border border-border bg-surface-alt px-2 py-1.5
                     font-mono text-sm text-text"
        >
          {ALGOS.map((a) => (
            <option key={a} value={a}>
              {ALGO_META[a].label}
              {ALGO_META[a].weak ? " (weak)" : ""}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}
