// Builds the files the e2e run drops on the page, plus the checksum lists it pastes.
// Hashes come from node:crypto, so the test compares the browser against an independent
// implementation rather than against itself.
//
//   npm run fixtures            # 300 MB big file
//   BIG_MB=5000 npm run fixtures  # the 5 GB case from the spec
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(here, "fixtures");
const BIG_MB = Number(process.env.BIG_MB ?? 300);

fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(path.join(DIR, "nested", "inner"), { recursive: true });

const write = (rel, buf) => {
  fs.writeFileSync(path.join(DIR, rel), buf);
  return rel;
};

const files = [];
files.push(write("alpha.txt", Buffer.from("The quick brown fox jumps over the lazy dog")));
files.push(write("beta.bin", crypto.randomBytes(64 * 1024)));
// twin.txt holds the same bytes as alpha.txt, which is what the duplicate tag keys on.
files.push(write("twin.txt", Buffer.from("The quick brown fox jumps over the lazy dog")));
files.push(write("empty.dat", Buffer.alloc(0)));
// Large enough that 40 copies at once is real work for the pool.
files.push(write("medium.bin", crypto.randomBytes(4 * 1024 * 1024)));
files.push(write(path.join("nested", "one.txt"), Buffer.from("nested one")));
files.push(write(path.join("nested", "inner", "two.txt"), Buffer.from("nested two")));

// A file several chunks long. The worker reads 8 MiB at a time, so this proves the
// streaming path rather than a single-buffer digest.
const big = path.join(DIR, "big.bin");
const block = crypto.randomBytes(1024 * 1024);
const out = fs.createWriteStream(big);
for (let i = 0; i < BIG_MB; i++) {
  // Vary each block so a bug that reads the same slice twice changes the hash.
  block.writeUInt32LE(i, 0);
  // Wait for drain, or a multi-GB fixture buffers the whole file in memory and dies.
  if (!out.write(Buffer.from(block))) {
    await new Promise((r) => out.once("drain", r));
  }
}
out.end();
await new Promise((r) => out.on("close", r));
files.push("big.bin");

const digest = (rel, algo) =>
  new Promise((resolve, reject) => {
    const h = crypto.createHash(algo);
    fs.createReadStream(path.join(DIR, rel))
      .on("data", (c) => h.update(c))
      .on("end", () => resolve(h.digest("hex")))
      .on("error", reject);
  });

const manifest = { files: {} };
for (const rel of files) {
  manifest.files[rel] = {
    size: fs.statSync(path.join(DIR, rel)).size,
    sha256: await digest(rel, "sha256"),
    sha1: await digest(rel, "sha1"),
    sha384: await digest(rel, "sha384"),
    sha512: await digest(rel, "sha512"),
    md5: await digest(rel, "md5"),
  };
}

// GNU format, the one `sha256sum` writes.
const listed = ["alpha.txt", "beta.bin", "twin.txt"];
fs.writeFileSync(
  path.join(DIR, "SHA256SUMS"),
  listed.map((f) => `${manifest.files[f].sha256}  ${f}`).join("\n") +
    `\n${"0".repeat(64)}  ghost.txt\n`,
);

// The same list with one hash corrupted, to prove a mismatch shows as a mismatch.
fs.writeFileSync(
  path.join(DIR, "SHA256SUMS.bad"),
  [
    `${manifest.files["alpha.txt"].sha256}  alpha.txt`,
    `${"f".repeat(64)}  beta.bin`,
  ].join("\n") + "\n",
);

// BSD `shasum --tag` output, which turns up on Apple and BSD downloads.
fs.writeFileSync(
  path.join(DIR, "SHA256SUMS.bsd"),
  `SHA256 (alpha.txt) = ${manifest.files["alpha.txt"].sha256}\n`,
);

fs.writeFileSync(path.join(DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`fixtures in ${DIR} (big.bin = ${BIG_MB} MB)`);
