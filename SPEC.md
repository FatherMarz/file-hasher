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

A single column. A tab switches the input panel between the drop zone and the paste box,
so only one of them takes up room.

```
┌────────────────────────────────────────┐
│ File Hasher                            │
│ Nothing leaves your computer.          │
├────────────────────────────────────────┤
│ [Files] Expected hash                  │
│ ┌────────────────────────────────────┐ │
│ │      drop files or folders         │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ ✓ ▸ installer.dmg  ⧉  412 MB a94f2c… ⧉ │
│ ✓ ▾ patch.zip      ⧉  2.1 MB 77bb01… ⧉ │
│      SHA-256  77bb01…c0fe            ⧉ │
│      SHA-384  bcd6e1…8fc7            ⧉ │
│      SHA-512  6d8703…60e2            ⧉ │
│      SHA-1    0e38dc…9217       weak ⧉ │
│      MD5      7e3979…1dd3       weak ⧉ │
│ · ▸ bundle.tar.gz  ⧉  ▓▓▓░ 61%    stop │
├────────────────────────────────────────┤
│ 3 files · 2.2 GB    copy .txt .csv ... │
├────────────────────────────────────────┤
│ FAQ                                    │
│ ▸ What is a hash?                      │
└────────────────────────────────────────┘
```

The results panel holds a fixed height and scrolls inside itself. Every row is the same
height. Long names and hashes cut off with an ellipsis rather than wrap.

Each value carries its own copy icon: one for the file name, one for the row's SHA-256,
and one for every hash inside an open row.

The FAQ sits in a closed list. Each question opens on its own.

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

Every file gets SHA-256, SHA-384, SHA-512, SHA-1 and MD5, in that order. There is no
picker. One read of the file feeds all five hashers, so the disk work happens once.

The closed row shows SHA-256. Open the row for the other four. SHA-1 and MD5 sit last,
because they are the weak pair.

MD5 and SHA-1 carry a short note. They are weak. Use them for checksums only.

## Verification

One paste box. It accepts a single hash, or a whole checksum file in the `<hash>  <filename>`
form that `sha256sum` writes. The tool works out which one it got.

- Case does not matter.
- The length of the pasted hash names its algorithm, and the tool checks against that one.
- A green check means match. A red cross means no match. A grey dot means there was
  nothing to compare.
- Inside an open row, the hash that matched turns green.
- If a pasted list names a file you did not drop, the tool says which one is missing.

## Duplicates

If two files hold the same bytes, each one says so under its row.

## Output

- Copy any single value with the icon beside it.
- Copy all rows as plain text in `sha256sum` format.
- Save as `.txt` (SHA-256), or as `.csv` or `.json` with all five hashes per file.

## FAQ (on the page, below the tool)

- What is a hash?
- Why check one?
- Where does my file go?
- How do I know that is true?
- Which algorithm do I use?
- Why do you mark MD5 and SHA-1 as weak?
- My hash does not match the one on the site. Now what?
- How big a file can I hash?
- Does it work offline?

Each answer runs to one or two sentences. Write for somebody competent who has not met
this particular tool. Do not explain what a download is.

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
