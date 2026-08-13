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
        SHA-256, unless the publisher gave you something else. Pick the algorithm that
        matches the hash you check against. If you paste a hash, this tool switches for
        you.
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
        First check that you picked the same algorithm. If you did, the file you hold is
        not the file they published. Download it again from the official source. If the
        hash still differs, do not run the file.
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
    a: (
      <>
        Yes. Load the page once. After that it opens and runs with the network off.
      </>
    ),
  },
];

export function Faq() {
  return (
    <section className="pt-4">
      <h2 className="mb-3 text-sm uppercase tracking-wider text-text-muted">FAQ</h2>
      <dl className="space-y-4">
        {ITEMS.map((item) => (
          <div key={item.q}>
            <dt className="text-sm font-semibold">{item.q}</dt>
            <dd className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
