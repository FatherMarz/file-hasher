export const ALGOS = ["sha256", "sha1", "sha384", "sha512", "md5"] as const;

export type Algo = (typeof ALGOS)[number];

type AlgoMeta = {
  label: string;
  /** Length of the hex digest. Used to guess the algorithm from a pasted hash. */
  hexLength: number;
  /** Extension `sha256sum` and friends use for a sidecar checksum file. */
  ext: string;
  weak: boolean;
};

export const ALGO_META: Record<Algo, AlgoMeta> = {
  sha256: { label: "SHA-256", hexLength: 64, ext: "sha256", weak: false },
  sha1: { label: "SHA-1", hexLength: 40, ext: "sha1", weak: true },
  sha384: { label: "SHA-384", hexLength: 96, ext: "sha384", weak: false },
  sha512: { label: "SHA-512", hexLength: 128, ext: "sha512", weak: false },
  md5: { label: "MD5", hexLength: 32, ext: "md5", weak: true },
};

export const DEFAULT_ALGO: Algo = "sha256";

/**
 * SHA-1 and MD5 share no digest length with the others, so length alone identifies
 * every algorithm we offer.
 */
export function algoFromHexLength(len: number): Algo | null {
  return ALGOS.find((a) => ALGO_META[a].hexLength === len) ?? null;
}

export function isAlgo(value: string): value is Algo {
  return (ALGOS as readonly string[]).includes(value);
}
