"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { nav } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // setState solo quando il valore cambia davvero (evita re-render a ogni evento di scroll)
    let last = false;
    const on = () => {
      const next = window.scrollY > 12;
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
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <div
        className={clsx(
          "glass-strong mx-auto flex max-w-6xl items-center justify-between rounded-full py-2.5 pl-5 pr-2.5 transition-shadow duration-300",
          scrolled ? "shadow-[0_18px_44px_-18px_rgba(37,40,45,0.3)]" : "",
        )}
      >
        <Link href="/" aria-label="Winex — pagina principală" className="rounded-full">
          <Logo />
        </Link>

        <nav aria-label="Navigare principală" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-red-soft text-red-deep" : "text-ink-soft hover:text-ink hover:bg-black/[0.04]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/configurator"
            className="hidden rounded-full bg-red px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(220,36,48,0.7)] transition hover:bg-red-deep sm:inline-flex"
          >
            Configurează
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/[0.05] md:hidden"
            aria-label={open ? "Închide meniul" : "Deschide meniul"}
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
          "glass-strong glass-solid mx-auto mt-2 max-w-6xl origin-top rounded-3xl transition-[opacity,transform,visibility] duration-200 ease-out md:hidden",
          open ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-2 scale-[0.97] opacity-0",
        )}
        inert={!open}
      >
        <nav aria-label="Navigare mobil" className="flex flex-col p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3.5 text-lg font-semibold text-ink hover:bg-black/[0.04]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/configurator"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-2xl bg-red px-4 py-3.5 text-center text-lg font-semibold text-white"
          >
            Configurează tâmplăria
          </Link>
        </nav>
      </div>
    </header>
  );
}
