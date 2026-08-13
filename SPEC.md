# File Hasher — Spec

Everything runs in the browser. There is no server and no upload. The page makes zero
network calls after it loads.

Name on the page: **File Hasher**. Address: `hash.modul4r.com`. Public repo. AGPL-3.0.

## Who it is for

People who check that a download or a build artifact is the exact file they expect. Software
supply chain work and release verification.

## What it does

1. You drop files or folders onto the page.
2. It hashes each file and shows the result.
3. You paste an expected hash or a whole checksum list. It says match or no match.
4. You copy the results out, or save them.

## The screen

A single column that scrolls.

```
┌────────────────────────────────────┐
│ File Hasher             SHA-256 ▾  │
│ Nothing leaves your computer.      │
├────────────────────────────────────┤
│                                    │
│      drop files or folders         │
│                                    │
├────────────────────────────────────┤
│ expected hash  [                 ] │
├────────────────────────────────────┤
│ ✓ installer.dmg   412 MB  a94f2c…  │
│ ✗ patch.zip       2.1 MB  77bb01…  │
│ ⋯ bundle.tar.gz   1.8 GB  ▓▓▓░ 61% │
├────────────────────────────────────┤
│ 3 files · 2.2 GB      copy   save  │
├────────────────────────────────────┤
│ FAQ                                │
└────────────────────────────────────┘
```

The theme follows the machine. Dark on a dark system, light on a light one.

## Rules

- Every byte stays on the machine.
- Files of any size work. Large files read in pieces, so the tab keeps its memory free.
- Hashing runs off the main thread. The page stays responsive.
- Several files hash at once, capped to the number of cores.
- Progress shows per file. You can cancel any file.
- Folders keep their paths in the output.
- A reload clears the screen. The tool stores nothing.
- The tool works offline after the first visit.

## Algorithms

One at a time, chosen from a dropdown: SHA-256 (default), SHA-1, SHA-384, SHA-512, MD5.

MD5 and SHA-1 carry a short note. They are weak. Use them for checksums only.

If you change the algorithm, the tool re-hashes the files on screen.

## Verification

One paste box. It accepts a single hash, or a whole checksum file in the `<hash>  <filename>`
form that `sha256sum` writes. The tool works out which one it got.

- Case does not matter.
- If the pasted hash needs a different algorithm, the tool switches and tells you.
- A green check means match. A red cross means no match. A grey dash means there was
  nothing to compare.
- If a pasted list names a file you did not drop, the tool says which one is missing.

## Duplicates

Two files with the same hash both get a small duplicate tag.

## Output

- Copy one hash with one click.
- Copy all rows as plain text in `sha256sum` format.
- Save as `.txt`, `.csv`, or `.json`.

## FAQ (on the page, below the tool)

- What is a hash?
- Why do I check one?
- Where does my file go? (Nowhere. It stays in the browser.)
- How do I know you are telling the truth? (Open the network tab. Read the source.)
- Which algorithm do I want?
- Why do you mark MD5 as weak?
- Why is my hash different from the one on the website?
- How big a file can I do?
- Does it work offline?

Each answer runs to two or three plain sentences.

## Out of scope

Uploads. Saved history. Folder-to-folder comparison. Signature checking. Zip contents.
Login. Paid tier. Analytics.

## Build

Vite, React, TypeScript, Tailwind. Own repo, own Vercel project, own subdomain.

Hashing uses `hash-wasm`. The browser's built-in crypto cannot hash a stream, so a large
file would have to sit in memory in one piece first. `hash-wasm` also covers MD5, which
browsers do not ship at all.

About seven code files: one worker, one worker pool, one store, five components.

## Done means

- A 5 GB file hashes and the tab does not crash.
- 500 small files hash and the page stays responsive.
- A known file produces the same hash as `shasum -a 256` on the command line.
- If you paste a real `SHA256SUMS` file from a Linux release, every row shows the right result.
- The network tab stays empty during a hash run.
- The tool loads and runs with the wifi off.
- Dark and light both look right.
