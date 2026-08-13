import { algoFromHexLength, type Algo } from "./algorithms";

export type Expected =
  /** A bare hash. Every file gets checked against it. */
  | { kind: "single"; hash: string; algo: Algo | null }
  /** A `sha256sum`-style list. Files match by name. */
  | { kind: "list"; entries: Map<string, string>; algo: Algo | null }
  | { kind: "empty" }
  | { kind: "unreadable" };

const HEX = /^[0-9a-f]+$/;

/**
 * `sha256sum` writes `<hash>  <filename>`: two spaces for text mode, ` *` for binary.
 * BSD `shasum --tag` writes `SHA256 (file) = <hash>`. Both turn up in the wild, so
 * both parse.
 */
const GNU_LINE = /^([0-9a-f]{32,128})\s+[*? ]?(.+)$/i;
const BSD_LINE = /^\w+[\w-]*\s*\((.+)\)\s*=\s*([0-9a-f]{32,128})$/i;

/** A checksum list names files by path. Compare on the last segment. */
export function baseName(path: string): string {
  const trimmed = path.replace(/[/\\]+$/, "");
  const cut = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  return cut >= 0 ? trimmed.slice(cut + 1) : trimmed;
}

export function parseExpected(raw: string): Expected {
  const text = raw.trim();
  if (!text) return { kind: "empty" };

  const single = text.toLowerCase();
  if (HEX.test(single) && algoFromHexLength(single.length)) {
    return { kind: "single", hash: single, algo: algoFromHexLength(single.length) };
  }

  const entries = new Map<string, string>();
  const lengths = new Set<number>();

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const bsd = BSD_LINE.exec(trimmed);
    if (bsd) {
      const hash = bsd[2].toLowerCase();
      entries.set(baseName(bsd[1].trim()), hash);
      lengths.add(hash.length);
      continue;
    }

    const gnu = GNU_LINE.exec(trimmed);
    if (gnu) {
      const hash = gnu[1].toLowerCase();
      entries.set(baseName(gnu[2].trim()), hash);
      lengths.add(hash.length);
    }
  }

  if (entries.size === 0) return { kind: "unreadable" };

  const algo = lengths.size === 1 ? algoFromHexLength([...lengths][0]) : null;
  return { kind: "list", entries, algo };
}

export type MatchState = "match" | "mismatch" | "none";

export function matchFor(
  expected: Expected,
  name: string,
  hash: string | null,
): { state: MatchState; want: string | null } {
  if (!hash) return { state: "none", want: null };

  if (expected.kind === "single") {
    return { state: expected.hash === hash ? "match" : "mismatch", want: expected.hash };
  }

  if (expected.kind === "list") {
    const want = expected.entries.get(baseName(name));
    if (!want) return { state: "none", want: null };
    return { state: want === hash ? "match" : "mismatch", want };
  }

  return { state: "none", want: null };
}

/** Names in a pasted list that never showed up in the drop. */
export function missingFromList(expected: Expected, names: string[]): string[] {
  if (expected.kind !== "list") return [];
  const dropped = new Set(names.map(baseName));
  return [...expected.entries.keys()].filter((n) => !dropped.has(n));
}
