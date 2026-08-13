import { useRef, useState } from "react";
import { pickedFromDrop, pickedFromInput } from "../lib/drop";
import type { Expected } from "../lib/expected";
import { useHashStore } from "../stores/hashStore";

function summary(expected: Expected): { text: string; bad: boolean } | null {
  switch (expected.kind) {
    case "single":
      return { text: "Checking every file against this hash.", bad: false };
    case "list":
      return {
        text: `Checking against ${expected.entries.size} ${
          expected.entries.size === 1 ? "line" : "lines"
        } from your list.`,
        bad: false,
      };
    case "unreadable":
      return { text: "That does not look like a hash or a checksum list.", bad: true };
    default:
      return null;
  }
}

function Tab({ mode, label }: { mode: "files" | "expected"; label: string }) {
  const current = useHashStore((s) => s.inputMode);
  const setMode = useHashStore((s) => s.setInputMode);
  const on = current === mode;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      onClick={() => setMode(mode)}
      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
        on ? "bg-accent text-accent-fg" : "text-text-muted hover:text-accent"
      }`}
    >
      {label}
    </button>
  );
}

export function InputPanel({
  expected,
  missing,
}: {
  expected: Expected;
  missing: string[];
}) {
  const mode = useHashStore((s) => s.inputMode);
  const addFiles = useHashStore((s) => s.addFiles);
  const text = useHashStore((s) => s.expectedText);
  const setText = useHashStore((s) => s.setExpectedText);

  const [over, setOver] = useState(false);
  const [reading, setReading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const hint = summary(expected);

  return (
    <section>
      <div role="tablist" className="mb-2 flex gap-1">
        <Tab mode="files" label="Files" />
        <Tab mode="expected" label="Expected hash" />
        {hint && mode === "files" && (
          <span className="ml-auto self-center text-xs text-text-muted">
            {hint.text}
          </span>
        )}
      </div>

      {mode === "files" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setOver(false);
            setReading(true);
            try {
              addFiles(await pickedFromDrop(e.dataTransfer));
            } finally {
              setReading(false);
            }
          }}
          onClick={() => input.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              input.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Drop files or folders here, or click to choose files"
          className={`card flex h-32 cursor-pointer flex-col items-center justify-center
                      gap-1 border-dashed text-center transition-colors
                      ${over ? "border-accent bg-surface-alt" : "hover:border-accent"}`}
        >
          <span className="text-base">
            {reading ? "Reading folder…" : "Drop files or folders"}
          </span>
          <span className="text-sm text-text-muted">or click to choose files</span>
          <input
            ref={input}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(pickedFromInput(e.target.files));
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="card h-32 p-2">
          <label htmlFor="expected" className="sr-only">
            Expected hash or checksum list
          </label>
          <textarea
            id="expected"
            value={text}
            spellCheck={false}
            placeholder="Paste one hash, or a whole SHA256SUMS file"
            onChange={(e) => setText(e.target.value)}
            className="h-full w-full resize-none rounded-md border border-border bg-bg
                       px-3 py-2 font-mono text-sm text-text placeholder:text-text-muted"
          />
        </div>
      )}

      <div className="mt-1.5 flex min-h-[1.25rem] flex-wrap gap-x-3 text-xs">
        {mode === "expected" && hint && (
          <span className={hint.bad ? "text-bad" : "text-text-muted"}>{hint.text}</span>
        )}
        {missing.length > 0 && (
          <span className="text-text-muted">
            Not dropped yet: <span className="font-mono">{missing.join(", ")}</span>
          </span>
        )}
      </div>
    </section>
  );
}
