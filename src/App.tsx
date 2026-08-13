import { useMemo } from "react";
import { matchFor, missingFromList, parseExpected } from "./lib/expected";
import type { Row } from "./lib/export";
import { Faq } from "./components/Faq";
import { Header } from "./components/Header";
import { InputPanel } from "./components/InputPanel";
import { Results } from "./components/Results";
import { Summary } from "./components/Summary";
import { duplicateHashes, useHashStore } from "./stores/hashStore";

export default function App() {
  const entries = useHashStore((s) => s.entries);
  const expectedText = useHashStore((s) => s.expectedText);

  const expected = useMemo(() => parseExpected(expectedText), [expectedText]);

  const rows: Row[] = useMemo(
    () =>
      entries.map((entry) => {
        const { state, want } = matchFor(expected, entry.path, entry.hashes);
        return { entry, state, want };
      }),
    [entries, expected],
  );

  const duplicates = useMemo(() => duplicateHashes(entries), [entries]);
  const missing = useMemo(
    () => missingFromList(expected, entries.map((e) => e.path)),
    [expected, entries],
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-3 px-4 py-6">
      <Header />
      <InputPanel expected={expected} missing={missing} />
      <Results rows={rows} duplicates={duplicates} />
      <Summary rows={rows} />
      <Faq />
      <footer className="mt-auto pt-6 text-xs text-text-muted">
        A{" "}
        <a href="https://modul4r.com" className="text-accent underline">
          Modul4r
        </a>{" "}
        tool. No account, no upload, no tracking.
      </footer>
    </div>
  );
}
