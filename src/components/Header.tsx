export function Header() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">File Hasher</h1>
        <p className="mt-1 text-sm text-text-muted">Nothing leaves your computer.</p>
      </div>
      <p className="text-xs text-text-muted">
        Every file gets SHA-256, SHA-1, SHA-384, SHA-512 and MD5 in one pass.
      </p>
    </header>
  );
}
