export type Picked = { file: File; path: string };

/**
 * Chrome, Safari and Firefox all expose dropped folders through the non-standard
 * `webkitGetAsEntry` tree. Nothing else reaches the files inside a dropped folder,
 * so the walk stays.
 */
type FileEntry = {
  isFile: true;
  isDirectory: false;
  name: string;
  file: (cb: (f: File) => void, err: (e: unknown) => void) => void;
};

type DirEntry = {
  isFile: false;
  isDirectory: true;
  name: string;
  createReader: () => {
    readEntries: (cb: (entries: Entry[]) => void, err: (e: unknown) => void) => void;
  };
};

type Entry = FileEntry | DirEntry;

function fileOf(entry: FileEntry): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file(
      (f) => resolve(f),
      () => resolve(null),
    );
  });
}

/** `readEntries` returns at most 100 entries per call and signals the end with []. */
function readAll(entry: DirEntry): Promise<Entry[]> {
  const reader = entry.createReader();
  const out: Entry[] = [];
  return new Promise((resolve) => {
    const step = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(out);
          return;
        }
        out.push(...batch);
        step();
      }, () => resolve(out));
    };
    step();
  });
}

async function walk(entry: Entry, prefix: string, out: Picked[]) {
  const path = prefix ? `${prefix}/${entry.name}` : entry.name;

  if (entry.isFile) {
    const file = await fileOf(entry);
    if (file) out.push({ file, path });
    return;
  }

  if (entry.isDirectory) {
    for (const child of await readAll(entry)) await walk(child, path, out);
  }
}

export async function pickedFromDrop(dt: DataTransfer): Promise<Picked[]> {
  const items = Array.from(dt.items).filter((i) => i.kind === "file");

  const entries = items
    .map((i) => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null))
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .map((e) => e as unknown as Entry);

  if (entries.length > 0) {
    const out: Picked[] = [];
    for (const entry of entries) await walk(entry, "", out);
    return out;
  }

  return Array.from(dt.files).map((file) => ({ file, path: file.name }));
}

export function pickedFromInput(list: FileList | null): Picked[] {
  if (!list) return [];
  return Array.from(list).map((file) => ({
    file,
    // `webkitdirectory` puts the relative path here; a plain file picker leaves it blank.
    path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
  }));
}
