const UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  let value = n;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${UNITS[unit]}`;
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function formatRate(bytes: number, ms: number): string {
  if (ms <= 0) return "";
  return `${formatBytes((bytes / ms) * 1000)}/s`;
}
