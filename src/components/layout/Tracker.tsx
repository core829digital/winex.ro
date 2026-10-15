"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type Payload = { type: "pv" | "click"; path: string; ref?: string; label?: string };

function send(p: Payload) {
  const body = JSON.stringify(p);
  try {
    if (navigator.sendBeacon?.("/api/collect", new Blob([body], { type: "application/json" }))) return;
  } catch {}
  fetch("/api/collect", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(
    () => undefined,
  );
}

const clean = (s: string, n = 60) => s.replace(/\s+/g, " ").trim().slice(0, n);

function labelFor(el: Element): string | null {
  const explicit = el.getAttribute("data-track");
  if (explicit) return clean(explicit);
  const text = clean(el.getAttribute("aria-label") || (el as HTMLElement).innerText || "");
  if (el instanceof HTMLAnchorElement) {
    const href = el.getAttribute("href") || "";
    if (href.startsWith("tel:")) return "tel: apel telefon";
    if (href.startsWith("mailto:")) return "email: scrie e-mail";
    if (/^https?:\/\//.test(href) && new URL(href).host !== location.host) return clean(`extern: ${new URL(href).host}`);
    return text ? `link: ${text}` : null;
  }
  return text ? `buton: ${text}` : null;
}

/**
 * Analytics proprietarie, senza cookie né storage: invia pagina vista e click a /api/collect.
 * Rispetta Do-Not-Track e Global Privacy Control. Peso trascurabile (nessuna libreria).
 */
export function Tracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;

    const run = () => {
      let ref: string | undefined;
      if (first.current) {
        first.current = false;
        const utm = new URLSearchParams(location.search).get("utm_source");
        if (utm) ref = `utm:${clean(utm, 40).toLowerCase()}`;
        else if (document.referrer) {
          try {
            const h = new URL(document.referrer).host;
            if (h && h !== location.host) ref = h.replace(/^www\./, "");
          } catch {}
        }
      }
      send({ type: "pv", path: pathname, ref });
    };
    if ("requestIdleCallback" in window) (window as Window).requestIdleCallback(run, { timeout: 2000 });
    else setTimeout(run, 300);
  }, [pathname]);

  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    let last = "";
    let lastAt = 0;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("a,button,[data-track]");
      if (!el) return;
      const label = labelFor(el);
      if (!label) return;
      const now = Date.now();
      if (label === last && now - lastAt < 500) return;
      last = label;
      lastAt = now;
      send({ type: "click", path: location.pathname, label });
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
