import { clsx } from "clsx";

/** Logo provvisorio (wordmark + marchio finestra). Sostituire con il logo ufficiale Winex. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--red)" />
        <rect x="7.5" y="7.5" width="17" height="17" rx="2.5" fill="none" stroke="#fff" strokeWidth="2" />
        <path d="M16 7.5v17M7.5 16h17" stroke="#fff" strokeWidth="2" />
      </svg>
      <span className="font-display text-[1.35rem] font-extrabold tracking-tight text-ink">
        win<span className="text-red">ex</span>
      </span>
    </span>
  );
}
