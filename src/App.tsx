import { useEffect, useMemo } from "react";
import { ALGO_META } from "./lib/algorithms";
import { matchFor, missingFromList, parseExpected } from "./lib/expected";
import type { Row } from "./lib/export";
import { Dropzone } from "./components/Dropzone";
import { ExpectedBox } from "./components/Expected";
import { Faq } from "./components/Faq";
import { Header } from "./components/Header";
import { Results } from "./components/Results";
import { Summary } from "./components/Summary";
import { duplicateHashes, useHashStore } from "./stores/hashStore";

export default function App() {
  const entries = useHashStore((s) => s.entries);
  const algo = useHashStore((s) => s.algo);
  const expectedText = useHashStore((s) => s.expectedText);
  const setAlgo = useHashStore((s) => s.setAlgo);

  const expected = useMemo(() => parseExpected(expectedText), [expectedText]);

  // A pasted hash names its own algorithm through its length. Follow it rather than
  // make the reader work out why nothing matches.
  useEffect(() => {
    const want =
      expected.kind === "single" || expected.kind === "list" ? expected.algo : null;
    if (want && want !== algo) {
      setAlgo(want, `Switched to ${ALGO_META[want].label} to match the hash you pasted.`);
    }
  }, [expected, algo, setAlgo]);

  const rows: Row[] = useMemo(
    () =>
      entries.map((entry) => {
        const { state, want } = matchFor(expected, entry.path, entry.hash);
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
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <Header />
      <Dropzone />
      <ExpectedBox expected={expected} missing={missing} />
      <Results rows={rows} duplicates={duplicates} />
      <Summary rows={rows} />
      <Faq />
      <footer className="mt-auto pt-8 text-xs text-text-muted">
        A{" "}
        <a href="https://modul4r.com" className="text-accent underline">
          Modul4r
        </a>{" "}
        tool. No account, no upload, no tracking.
      </footer>
    </div>
  );
}
