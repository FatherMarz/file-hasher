import { useState } from "react";
import { copy } from "../lib/export";

/** Copy control that sits beside a value rather than at the end of a row. */
export function CopyIcon({ value, label }: { value: string; label: string }) {
  const [hit, setHit] = useState(false);

  return (
    <button
      type="button"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
      onClick={async (e) => {
        e.stopPropagation();
        if (await copy(value)) {
          setHit(true);
          setTimeout(() => setHit(false), 1000);
        }
      }}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded
                  border border-transparent transition-colors
                  ${hit ? "text-ok" : "text-text-muted hover:border-border hover:text-accent"}`}
    >
      {hit ? (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            d="M3 8.5l3.2 3.2L13 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
          <rect
            x="5.5"
            y="5.5"
            width="8"
            height="8"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M10.5 3.5A1.5 1.5 0 009 2H4a1.5 1.5 0 00-1.5 1.5v5A1.5 1.5 0 004 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
