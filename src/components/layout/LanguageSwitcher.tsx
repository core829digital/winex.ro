"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Globe } from "lucide-react";
import { clsx } from "clsx";
import { Link, usePathname } from "@/i18n/navigation";
import { localeMeta, locales } from "@/i18n/routing";

/** Selettore lingua accessibile (menu con link reali: funziona anche senza JS e resta indicizzabile). */
export function LanguageSwitcher({ className, align = "right" }: { className?: string; align?: "left" | "right" }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={clsx("relative", className)}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${t("language")}: ${localeMeta[locale as keyof typeof localeMeta]?.name}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 rounded-[var(--r-btn)] px-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-black/[0.05] hover:text-ink"
      >
        <Globe size={17} aria-hidden />
        <span className="tabular-nums">{localeMeta[locale as keyof typeof localeMeta]?.short}</span>
        <ChevronDown size={14} aria-hidden className={clsx("transition-transform duration-200", open && "rotate-180")} />
      </button>
      <ul
        className={clsx(
          "absolute z-50 mt-2 w-48 origin-top rounded-[var(--r-card)] border border-line bg-white p-1.5 shadow-[var(--shadow-md)] transition-[opacity,transform,visibility] duration-200 ease-[var(--ease-out)]",
          align === "right" ? "right-0" : "left-0",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
        )}
        inert={!open}
      >
        {locales.map((l) => (
          <li key={l}>
            <Link
              href={pathname}
              locale={l}
              hrefLang={l}
              lang={l}
              onClick={() => setOpen(false)}
              aria-current={l === locale ? "true" : undefined}
              className={clsx(
                "flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                l === locale ? "bg-red-soft font-semibold text-red-deep" : "text-ink hover:bg-black/[0.05]",
              )}
            >
              <span>{localeMeta[l].name}</span>
              {l === locale ? <Check size={15} aria-hidden /> : <span className="text-xs font-semibold text-ink-mute">{localeMeta[l].short}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
