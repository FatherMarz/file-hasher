const REPO = "https://github.com/FatherMarz/file-hasher";

const ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is a hash?",
    a: (
      <>
        A hash is a short string of letters and numbers that a file produces. Change one
        byte of the file and the hash changes completely. Two files with the same hash
        hold the same bytes.
      </>
    ),
  },
  {
    q: "Why do I check one?",
    a: (
      <>
        A download can arrive damaged, or someone can swap it for a different file. The
        publisher posts the hash of the correct file. If your hash matches theirs, you
        hold the right file.
      </>
    ),
  },
  {
    q: "Where does my file go?",
    a: (
      <>
        Nowhere. The file stays in your browser. This page makes no network calls after
        it loads.
      </>
    ),
  },
  {
    q: "How do I know you are telling the truth?",
    a: (
      <>
        Open the network tab in your browser and hash a file. You will see no requests.
        The source code is public at{" "}
        <a href={REPO} className="text-accent underline">
          github.com/FatherMarz/file-hasher
        </a>
        .
      </>
    ),
  },
  {
    q: "Which algorithm do I want?",
    a: (
      <>
        You get all five at once, so you never pick. The row shows SHA-256. Open a row
        to see SHA-1, SHA-384, SHA-512 and MD5. A pasted hash finds its own algorithm.
      </>
    ),
  },
  {
    q: "Why do you mark MD5 and SHA-1 as weak?",
    a: (
      <>
        A skilled attacker can build two different files that share one MD5 or SHA-1
        hash. Use them to catch a damaged download. Do not use them to prove a file is
        safe.
      </>
    ),
  },
  {
    q: "Why is my hash different from the one on the website?",
    a: (
      <>
        The file you hold is not the file they published. Download it again from the
        official source. If the hash still differs, do not run the file.
      </>
    ),
  },
  {
    q: "How big a file can I do?",
    a: (
      <>
        There is no limit. The tool reads a large file in pieces, so the browser holds
        one piece at a time. A 5 GB file works.
      </>
    ),
  },
  {
    q: "Does it work offline?",
    a: <>Yes. Load the page once. After that it opens and runs with the network off.</>,
  },
];

export function Faq() {
  return (
    <section className="pt-2">
      <h2 className="mb-2 text-sm uppercase tracking-wider text-text-muted">FAQ</h2>
      <div className="divide-y divide-border rounded-lg border border-border">
        {ITEMS.map((item) => (
          <details key={item.q} className="group">
            <summary
              className="flex cursor-pointer list-none items-center gap-2 px-3 py-2
                         text-sm hover:text-accent"
            >
              <span className="w-3 text-xs text-text-muted group-open:hidden">▸</span>
              <span className="hidden w-3 text-xs text-text-muted group-open:inline">
                ▾
              </span>
              {item.q}
            </summary>
            <p className="max-w-2xl px-8 pb-3 text-sm leading-relaxed text-text-muted">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
