// End-to-end run against the built site. Every hash assertion compares the browser
// against node:crypto, never against another browser result.
//
//   npm run build && npm run fixtures && npm run e2e
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const BASE = process.env.E2E_BASE ?? "http://localhost:4178";
const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(here, "fixtures");
const M = JSON.parse(fs.readFileSync(path.join(FIXTURES, "manifest.json"), "utf8")).files;
const fx = (...p) => path.join(FIXTURES, ...p);

let failures = 0;
function check(name, pass, detail = "") {
  console.log(`${pass ? "  ok" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures++;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
page.on("pageerror", (e) => {
  console.log(`FAIL  pageerror — ${e.message}`);
  failures++;
});

// Anything the page requests after first paint is a privacy bug, so log the lot.
const requests = [];
page.on("request", (r) => requests.push({ url: r.url(), method: r.method() }));

await page.goto(BASE, { waitUntil: "networkidle" });

const toFiles = () => page.click('button[role="tab"]:has-text("Files")');
const toExpected = () => page.click('button[role="tab"]:has-text("Expected hash")');

const drop = async (...names) => {
  await toFiles();
  await page.setInputFiles(
    'input[type="file"]',
    names.map((n) => fx(...n.split("/"))),
  );
};

const rowFor = (name) =>
  page.locator("li").filter({ has: page.locator(`text="${name}"`) }).first();

/** The closed row shows SHA-256. Opening it lists all five. */
const hashOf = async (name) => {
  const row = rowFor(name);
  await row.locator(".font-mono").first().waitFor({ timeout: 180000 });
  return (await row.locator(".font-mono").first().getAttribute("title")) ?? "";
};

const openRow = async (name) => {
  const row = rowFor(name);
  if ((await row.locator(".font-mono").count()) < 2) await row.locator("div").first().click();
  await page.waitForTimeout(120);
  return row;
};

const setExpected = async (text) => {
  await toExpected();
  await page.fill("#expected", text);
  await page.waitForTimeout(150);
};

const markOf = async (name) =>
  (await rowFor(name).locator("span[aria-label]").first().getAttribute("aria-label")) ?? "";

// --- small files ---------------------------------------------------------
await drop("alpha.txt", "beta.bin", "empty.dat");
check("sha256 of a text file", (await hashOf("alpha.txt")) === M["alpha.txt"].sha256);
check("sha256 of binary bytes", (await hashOf("beta.bin")) === M["beta.bin"].sha256);
check("sha256 of an empty file", (await hashOf("empty.dat")) === M["empty.dat"].sha256);

// --- every algorithm, from one pass over the file ------------------------
const row = await openRow("alpha.txt");
const shown = await row.locator(".font-mono").evaluateAll((els) =>
  els.map((el) => el.getAttribute("title")),
);
for (const key of ["sha256", "sha1", "sha384", "sha512", "md5"]) {
  check(`${key} matches node:crypto`, shown.includes(M["alpha.txt"][key]));
}
await row.locator("div").first().click();

// --- verification against a single pasted hash ---------------------------
await setExpected(M["alpha.txt"].sha256);
check("pasted hash marks the right file", (await markOf("alpha.txt")).includes("Matches"));
check("pasted hash marks the others", (await markOf("beta.bin")).includes("not match"));

// --- a pasted hash of any algorithm finds its own lane -------------------
await setExpected(M["alpha.txt"].md5);
check("an MD5 paste matches without a picker", (await markOf("alpha.txt")).includes("Matches"));
await setExpected(M["alpha.txt"].sha512);
check("a SHA-512 paste matches too", (await markOf("alpha.txt")).includes("Matches"));

await setExpected("");
await page.click('button:has-text("clear")');

// --- a real checksum list ------------------------------------------------
await drop("alpha.txt", "beta.bin", "twin.txt");
await hashOf("beta.bin");
await setExpected(fs.readFileSync(fx("SHA256SUMS"), "utf8"));
check("list marks alpha", (await markOf("alpha.txt")).includes("Matches"));
check("list marks beta", (await markOf("beta.bin")).includes("Matches"));
check("list marks twin", (await markOf("twin.txt")).includes("Matches"));
check(
  "names a file from the list that was not dropped",
  (await page.locator("text=Not dropped yet").innerText()).includes("ghost.txt"),
);

await setExpected(fs.readFileSync(fx("SHA256SUMS.bad"), "utf8"));
check("a corrupted line reads as no match", (await markOf("beta.bin")).includes("not match"));

await setExpected(fs.readFileSync(fx("SHA256SUMS.bsd"), "utf8"));
check("BSD tag format parses", (await markOf("alpha.txt")).includes("Matches"));

await setExpected("not a hash at all");
check(
  "junk input says so",
  await page.locator("text=does not look like a hash").isVisible(),
);
await setExpected("");

// --- duplicates ----------------------------------------------------------
check(
  "identical files are called out",
  (await page.locator("text=holds the same bytes").count()) === 2,
);

// --- exports -------------------------------------------------------------
async function grab(trigger) {
  const [dl] = await Promise.all([page.waitForEvent("download"), trigger()]);
  const p = path.join(os.tmpdir(), dl.suggestedFilename());
  await dl.saveAs(p);
  return fs.readFileSync(p, "utf8");
}

const txt = await grab(() => page.click('button:has-text(".txt")'));
check(
  "the .txt export is sha256sum format",
  txt.includes(`${M["alpha.txt"].sha256}  alpha.txt`),
  txt.split("\n")[0],
);
const json = JSON.parse(await grab(() => page.click('button:has-text(".json")')));
check("the .json export carries every file", json.files.length === 3);
check(
  "the .json export carries all five hashes",
  json.files.every((f) => Object.keys(f.hashes).length === 5) &&
    json.files.find((f) => f.path === "alpha.txt").hashes.md5 === M["alpha.txt"].md5,
);
const csv = await grab(() => page.click('button:has-text(".csv")'));
check(
  "the .csv export has a column per algorithm",
  csv.split("\n")[0] === "path,size_bytes,sha256,sha1,sha384,sha512,md5,expected,result",
  csv.split("\n")[0],
);

// --- folders -------------------------------------------------------------
await page.click('button:has-text("clear")');
await toFiles();
await page.setInputFiles('input[type="file"]', [
  fx("nested", "one.txt"),
  fx("nested", "inner", "two.txt"),
]);
check("a file from a folder hashes", (await hashOf("one.txt")) === M["nested/one.txt"].sha256);
check("a nested file hashes", (await hashOf("two.txt")) === M["nested/inner/two.txt"].sha256);

// --- many files at once --------------------------------------------------
// 40 copies of a 4 MB file: 160 MB spread across the pool, enough that a blocked main
// thread or a shared-state bug in the worker shows up.
await page.click('button:has-text("clear")');
await toFiles();
const COPIES = 40;
const t0 = Date.now();
await page.setInputFiles(
  'input[type="file"]',
  Array.from({ length: COPIES }, () => fx("medium.bin")),
);
await page.locator(`li:has-text("medium.bin")`).nth(COPIES - 1).waitFor({ timeout: 120000 });
await page.waitForFunction(
  (n) =>
    document.querySelectorAll("li").length === n &&
    document.querySelectorAll("li .font-mono").length === n,
  COPIES,
  { timeout: 300000 },
);
const hashes = await page
  .locator("li .font-mono")
  .evaluateAll((els) => els.map((el) => el.getAttribute("title")));
check(`all ${COPIES} concurrent files hash`, hashes.length === COPIES);
check(
  "every concurrent hash is correct",
  hashes.every((h) => h === M["medium.bin"].sha256),
  `${new Set(hashes).size} distinct results`,
);
console.log(`       ${COPIES} × 4 MB in ${Date.now() - t0} ms`);

// The page still answers while that ran, which is the point of the worker pool.
await setExpected(M["medium.bin"].sha256);
check(
  "the page stayed interactive",
  (await page.locator('span[aria-label="Matches the expected hash"]').count()) === COPIES,
);
await setExpected("");

// --- the large file ------------------------------------------------------
await page.click('button:has-text("clear")');
const t1 = Date.now();
await drop("big.bin");
check(
  `a ${(M["big.bin"].size / 1024 ** 2).toFixed(0)} MB file hashes correctly`,
  (await hashOf("big.bin")) === M["big.bin"].sha256,
);
console.log(`       big.bin in ${Date.now() - t1} ms`);

// --- cancel --------------------------------------------------------------
await page.click('button:has-text("clear")');
await drop("big.bin");
await page.locator('button:has-text("stop")').first().click();
await page.locator("text=Cancelled.").waitFor({ timeout: 20000 });
check("cancel stops a running file", true);

// --- the fixed panel and the uniform rows --------------------------------
await page.click('button:has-text("clear")');
await drop("alpha.txt", "beta.bin", "twin.txt", "nested/one.txt");
await hashOf("one.txt");
const heights = await page
  .locator("li > div:first-child")
  .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
check(
  "every row is the same height",
  new Set(heights).size === 1,
  `${[...new Set(heights)].join(", ")}px`,
);
const panel = await page
  .locator('section[aria-label="Results"]')
  .evaluate((el) => ({ h: el.clientHeight, scroll: el.scrollHeight }));
check("the results panel holds a fixed height", panel.h > 300 && panel.h < 400, `${panel.h}px`);

// --- the FAQ opens one section at a time ---------------------------------
check("the FAQ starts closed", (await page.locator("details[open]").count()) === 0);
await page.locator("details summary").first().click();
check("a FAQ section opens", (await page.locator("details[open]").count()) === 1);
await page.locator("details summary").first().click();

// --- the copy icons ------------------------------------------------------
await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
const alphaRow = rowFor("alpha.txt");
await alphaRow.locator('button[aria-label="Copy SHA-256"]').click();
check(
  "the hash copy icon copies the hash",
  (await page.evaluate(() => navigator.clipboard.readText())) === M["alpha.txt"].sha256,
);
await alphaRow.locator('button[aria-label="Copy file name"]').click();
check(
  "the name copy icon copies the name",
  (await page.evaluate(() => navigator.clipboard.readText())) === "alpha.txt",
);
const opened = await openRow("alpha.txt");
await opened.locator('button[aria-label="Copy MD5"]').click();
check(
  "an opened row copies any algorithm",
  (await page.evaluate(() => navigator.clipboard.readText())) === M["alpha.txt"].md5,
);

// --- privacy -------------------------------------------------------------
const offsite = requests.filter((r) => !r.url.startsWith(BASE));
check(
  "no third-party request in the whole run",
  offsite.length === 0,
  offsite.map((r) => r.url).join(" "),
);
const uploads = requests.filter((r) => r.method !== "GET" && r.method !== "HEAD");
check(
  "nothing was uploaded anywhere",
  uploads.length === 0,
  uploads.map((r) => `${r.method} ${r.url}`).join(" "),
);
// Everything it did fetch is its own shell, fetched once at load.
const shell = requests.filter((r) => r.url.startsWith(BASE)).map((r) => r.url);
check(
  "it only ever loaded its own files",
  shell.every((u) => /(\/$|\.js|\.css|\.svg|\.webmanifest|\.html)/.test(u)),
  shell.join(" "),
);

// --- offline -------------------------------------------------------------
// The service worker only registers on a production build, which is what `vite preview`
// serves. Wait for it to take control, then pull the network and reload.
await page.evaluate(async () => {
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) {
    await new Promise((r) =>
      navigator.serviceWorker.addEventListener("controllerchange", r, { once: true }),
    );
  }
});
await page.context().setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" });
check("the page loads with the network off", await page.locator("h1").isVisible());
await drop("alpha.txt");
check(
  "and still hashes",
  (await hashOf("alpha.txt")) === M["alpha.txt"].sha256,
);
await page.context().setOffline(false);

// --- both themes ---------------------------------------------------------
const shots = path.join(here, "..", "shots");
fs.mkdirSync(shots, { recursive: true });
// Fill the panel first, so the screenshots show a real working state.
await page.context().setOffline(false);
await page.click('button:has-text("clear")');
await drop("alpha.txt", "beta.bin", "twin.txt", "empty.dat", "nested/one.txt");
await hashOf("one.txt");
await setExpected(fs.readFileSync(fx("SHA256SUMS"), "utf8"));
await toFiles();
await openRow("beta.bin");
for (const scheme of ["dark", "light"]) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(shots, `${scheme}.png`), fullPage: true });
}
await page.emulateMedia({ colorScheme: "dark" });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(150);
await page.screenshot({ path: path.join(shots, "phone.png"), fullPage: true });
// Nothing may spill past the viewport on a phone.
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth,
);
check("the layout fits a phone", overflow <= 0, `${overflow}px of overflow`);
await page.setViewportSize({ width: 1200, height: 900 });

await browser.close();
console.log(failures === 0 ? "\nall checks passed" : `\n${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
