import { useRef, useState } from "react";
import { pickedFromDrop, pickedFromInput } from "../lib/drop";
import { useHashStore } from "../stores/hashStore";

export function Dropzone() {
  const addFiles = useHashStore((s) => s.addFiles);
  const [over, setOver] = useState(false);
  const [reading, setReading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setOver(false);
        setReading(true);
        try {
          addFiles(await pickedFromDrop(e.dataTransfer));
        } finally {
          setReading(false);
        }
      }}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          input.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Drop files or folders here, or click to choose files"
      className={`card flex cursor-pointer flex-col items-center justify-center gap-1
                  border-dashed px-6 py-12 text-center transition-colors
                  ${over ? "border-accent bg-surface-alt" : "hover:border-accent"}`}
    >
      <span className="text-base">
        {reading ? "Reading folder…" : "Drop files or folders"}
      </span>
      <span className="text-sm text-text-muted">or click to choose files</span>
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(pickedFromInput(e.target.files));
          e.target.value = "";
        }}
      />
    </div>
  );
}
