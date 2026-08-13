import type { Expected } from "../lib/expected";
import { useHashStore } from "../stores/hashStore";

function summary(expected: Expected): string | null {
  switch (expected.kind) {
    case "single":
      return "Checking every file against this hash.";
    case "list":
      return `Checking against ${expected.entries.size} ${
        expected.entries.size === 1 ? "line" : "lines"
      } from your list.`;
    case "unreadable":
      return "That does not look like a hash or a checksum list.";
    default:
      return null;
  }
}

export function ExpectedBox({
  expected,
  missing,
}: {
  expected: Expected;
  missing: string[];
}) {
  const text = useHashStore((s) => s.expectedText);
  const setText = useHashStore((s) => s.setExpectedText);
  const note = useHashStore((s) => s.algoNote);
  const dismiss = useHashStore((s) => s.dismissNote);

  const hint = summary(expected);

  return (
    <section className="card p-3">
      <label
        htmlFor="expected"
        className="mb-2 block text-sm text-text-muted"
      >
        Expected hash or checksum list
      </label>
      <textarea
        id="expected"
        value={text}
        rows={text.includes("\n") ? 5 : 2}
        spellCheck={false}
        placeholder="Paste one hash, or a whole SHA256SUMS file"
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-y rounded-md border border-border bg-bg px-3 py-2
                   font-mono text-sm text-text placeholder:text-text-muted"
      />

      {note && (
        <p className="mt-2 flex items-start gap-2 text-sm text-accent">
          <span>{note}</span>
          <button onClick={dismiss} className="underline" aria-label="Dismiss">
            ok
          </button>
        </p>
      )}

      {hint && (
        <p
          className={`mt-2 text-sm ${
            expected.kind === "unreadable" ? "text-bad" : "text-text-muted"
          }`}
        >
          {hint}
        </p>
      )}

      {missing.length > 0 && (
        <p className="mt-2 text-sm text-text-muted">
          Not dropped yet: <span className="font-mono">{missing.join(", ")}</span>
        </p>
      )}
    </section>
  );
}
