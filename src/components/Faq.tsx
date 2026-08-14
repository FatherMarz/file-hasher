const REPO = "https://github.com/FatherMarz/file-hasher";

const ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is a hash?",
    a: (
      <>
        A hash is a fingerprint of a file. The same file always produces the same
        fingerprint. Change one byte and you get a completely different one.
      </>
    ),
  },
  {
    q: "Why check one?",
    a: (
      <>
        A download can arrive damaged, and an attacker can swap it. The publisher posts
        the fingerprint of the real file. If yours matches, you hold the same bytes.
      </>
    ),
  },
  {
    q: "Where does my file go?",
    a: (
      <>
        Nowhere. The hashing runs inside your browser. The page makes no network calls
        once it loads, and it never reads the file anywhere else.
      </>
    ),
  },
  {
    q: "How do I know that is true?",
    a: (
      <>
        Open the network tab and hash a file. No requests fire. The source is public at{" "}
        <a href={REPO} className="text-accent underline">
          github.com/FatherMarz/file-hasher
        </a>
        .
      </>
    ),
  },
  {
    q: "Which algorithm do I use?",
    a: (
      <>
        Whichever one the publisher gave you. You get all five from a single read, so
        you never choose up front. A pasted hash finds its own algorithm.
      </>
    ),
  },
  {
    q: "Why do you mark MD5 and SHA-1 as weak?",
    a: (
      <>
        The algorithm is not strong and the fingerprint can be faked. Trust SHA-256 for
        anything that matters.
      </>
    ),
  },
  {
    q: "My hash does not match the one on the site. Now what?",
    a: (
      <>
        The bytes you hold are not the bytes they published. An interrupted download, a
        mirror serving another build, or a new release against an old hash all cause it.
        Download again from the source. If it still differs, do not run the file.
      </>
    ),
  },
  {
    q: "How big a file can I hash?",
    a: (
      <>
        Any size. The file reads in 8 MiB slices, so memory stays flat no matter how
        large it gets. 5 GB is tested.
      </>
    ),
  },
  {
    q: "Does it work offline?",
    a: (
      <>
        Yes. The first visit caches the app. After that it opens with the network off,
        which is one way to confirm nothing is uploaded.
      </>
    ),
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
