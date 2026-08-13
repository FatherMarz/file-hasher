# File Hasher

Checksum files in your browser. Drop a file, get its SHA-256, and check it against the
hash the publisher posted.

Live at [hash.modul4r.com](https://hash.modul4r.com).

The file stays on your machine. There is no server, no upload, no account, and no size
limit. Once the page loads it makes no network calls, which you can confirm in the
network tab.

## What it does

- Hashes with SHA-256, SHA-1, SHA-384, SHA-512 and MD5 at once, from one read of the file.
- Shows SHA-256 on the row. Open a row for the other four.
- Takes files or whole folders, by drop or by picker.
- Checks results against a single pasted hash, or against a full `SHA256SUMS` list.
  Both the GNU format and the BSD `--tag` format parse. Any algorithm matches.
- Says when two files hold the same bytes.
- Exports as `sha256sum` text, CSV, or JSON.
- Works offline after the first visit.

## How it works

`hash-wasm` does the hashing. WebCrypto cannot hash a stream, so a 5 GB file would
have to sit in memory in one piece before `crypto.subtle.digest` could touch it.

Each file is read in 8 MiB slices inside a worker. Every slice feeds all five hashers
before the next one is read, so a file is pulled off disk exactly once. One worker runs
per core, minus one for the UI. A cancel lands between slices.

## Develop

```sh
npm install
npm run dev        # http://localhost:5178
```

## Test

The suite drives the built site with Playwright and compares every hash against
`node:crypto`, so it checks the browser against an independent implementation.

```sh
npm run build
npm run fixtures            # 300 MB large-file case
npm run e2e
```

The spec's 5 GB case needs a bigger fixture and about 5 GB of free disk:

```sh
BIG_MB=5000 npm run fixtures && npm run e2e
```

The run also pulls the network and reloads, to prove the offline path, and writes
screenshots of both themes to `shots/`.

## Licence

AGPL-3.0-only. A [Modul4r](https://modul4r.com) tool.
