import { clsx } from "clsx";

/** Logo provvisorio (wordmark + marchio finestra). Sostituire con il logo ufficiale Winex. */
export function Logo({ className, inverse }: { className?: string; inverse?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="5" fill="var(--red)" />
        <rect x="8" y="8" width="16" height="16" rx="1.5" fill="none" stroke="#fff" strokeWidth="2" />
        <path d="M16 8v16M8 16h16" stroke="#fff" strokeWidth="2" />
      </svg>
      <span className={clsx("font-display text-[1.375rem] font-extrabold tracking-tight", inverse ? "text-white" : "text-ink")}>
        win<span className={inverse ? "text-[#ff6b75]" : "text-red"}>ex</span>
      </span>
    </span>
  );
}
