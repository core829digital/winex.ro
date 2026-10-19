"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { Link, usePathname } from "@/i18n/navigation";
import { navItems } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations("nav");
  const c = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // setState solo quando il valore cambia davvero (evita re-render a ogni evento di scroll)
    let last = false;
    const on = () => {
      const next = window.scrollY > 8;
      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className="site-header sticky top-0 z-50" data-scrolled={scrolled}>
      <div className="container-x flex h-[4.25rem] items-center justify-between gap-6">
        <Link href="/" aria-label={c("home")} className="shrink-0 rounded-md">
          <Logo />
        </Link>

        <nav aria-label={t("label")} className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "group relative px-3.5 py-2 text-[0.9375rem] font-medium transition-colors",
                  active ? "text-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                {t(item.key)}
                <span
                  aria-hidden
                  className={clsx(
                    "absolute inset-x-3.5 -bottom-[1.05rem] h-0.5 origin-left bg-red transition-transform duration-300 ease-[var(--ease-out)]",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <div className="hidden md:block">
            <ButtonLink href="/configurator" className="!px-5 !py-2.5 !text-sm">
              {t("cta")}
            </ButtonLink>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-[var(--r-btn)] text-ink hover:bg-black/[0.05] md:hidden"
            aria-label={open ? c("menuClose") : c("menuOpen")}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={clsx(
          "absolute inset-x-0 top-full origin-top border-b border-line bg-white shadow-[var(--shadow-md)] transition-[opacity,transform,visibility] duration-200 ease-out md:hidden",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
        inert={!open}
      >
        <nav aria-label={t("mobileLabel")} className="container-x flex flex-col py-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
              className={clsx(
                "border-b border-line py-4 text-lg font-semibold",
                pathname === item.href ? "text-red-deep" : "text-ink",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
          <ButtonLink href="/configurator" onClick={() => setOpen(false)} className="mt-4" arrow>
            {t("cta")}
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
