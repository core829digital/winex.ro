"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSubmit } from "./useSubmit";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type Turnstile = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const field =
  "w-full rounded-[var(--r-btn)] border border-[var(--line-strong)] bg-white px-4 py-3 text-ink outline-none transition placeholder:text-ink-mute focus:border-red focus:ring-4 focus:ring-red/10";

export function ContactForm({ source = "contact" }: { source?: string }) {
  const t = useTranslations("forms.contact");
  const e = useTranslations("forms.errors");
  const locale = useLocale();
  const id = useId();
  const { state, submit } = useSubmit("/api/contact");
  const [consent, setConsent] = useState(false);
  const [ft, setFt] = useState("");
  const [captcha, setCaptcha] = useState("");
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  // Token di modulo firmato dal server (anti-bot): richiesto al caricamento e rinnovato dopo ogni invio fallito.
  const loadToken = useCallback(async () => {
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch("/api/form-token", { cache: "no-store", credentials: "same-origin" });
        if (r.ok) {
          setFt(((await r.json()) as { token: string }).token);
          return;
        }
      } catch {
        /* riprova */
      }
      await new Promise((res) => setTimeout(res, 1500));
    }
  }, []);
  useEffect(() => {
    const id = setTimeout(() => void loadToken(), 0);
    return () => clearTimeout(id);
  }, [loadToken]);

  // Cloudflare Turnstile (solo se configurato)
  useEffect(() => {
    if (!SITE_KEY || !widget.current) return;
    const el = widget.current;
    const mount = () => {
      if (!window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(el, {
        sitekey: SITE_KEY,
        callback: (tok: string) => setCaptcha(tok),
        "expired-callback": () => setCaptcha(""),
        "error-callback": () => setCaptcha(""),
      });
    };
    if (window.turnstile) mount();
    else {
      const src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      let sc = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
      if (!sc) {
        sc = document.createElement("script");
        sc.src = src;
        sc.async = true;
        document.head.appendChild(sc);
      }
      sc.addEventListener("load", mount);
    }
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-start gap-3 py-6">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-red-soft text-red">
          <CheckCircle2 size={26} aria-hidden />
        </span>
        <h3 className="text-2xl">{t("successTitle")}</h3>
        <p className="max-w-sm text-ink-soft">{t("successText")}</p>
      </div>
    );
  }

  const label = "mb-1.5 block text-sm font-semibold text-ink";
  return (
    <form
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        void submit({
          ft,
          turnstile: captcha || undefined,
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          subject: fd.get("subject") || undefined,
          message: fd.get("message"),
          consent,
          website: fd.get("website"),
          source,
          locale,
        }).then((ok) => {
          if (!ok) {
            setFt("");
            void loadToken();
            if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
            setCaptcha("");
          }
        });
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className={label}>{t("name")} *</label>
          <input id={`${id}-name`} name="name" required autoComplete="name" className={field} placeholder={t("namePh")} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={label}>{t("email")} *</label>
          <input id={`${id}-email`} name="email" type="email" required autoComplete="email" className={field} placeholder={t("emailPh")} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-phone`} className={label}>{t("phone")}</label>
          <input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" className={field} placeholder={t("phonePh")} />
        </div>
        <div>
          <label htmlFor={`${id}-subject`} className={label}>{t("subject")}</label>
          <input id={`${id}-subject`} name="subject" className={field} placeholder={t("subjectPh")} />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-message`} className={label}>{t("message")} *</label>
        <textarea id={`${id}-message`} name="message" required rows={6} className={`${field} resize-y`} placeholder={t("messagePh")} />
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-soft">
        <input type="checkbox" checked={consent} onChange={(ev) => setConsent(ev.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--red)]" />
        <span>
          {t.rich("consent", {
            link: (chunks) => (
              <Link href="/privacy" className="font-semibold text-red-deep underline underline-offset-2">{chunks}</Link>
            ),
          })}{" "}*
        </span>
      </label>

      {SITE_KEY && <div ref={widget} className="min-h-[65px]" />}

      {state.status === "error" && (
        <p role="alert" className="rounded-[var(--r-btn)] border border-red/20 bg-red-soft px-4 py-3 text-sm font-medium text-red-deep">
          {e.has(state.code as never) ? e(state.code as never) : e("generic")}
        </p>
      )}

      <button
        type="submit"
        disabled={state.status === "loading" || !consent || !ft || (Boolean(SITE_KEY) && !captcha)}
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-[var(--r-btn)] bg-red px-7 py-3.5 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-red-deep disabled:opacity-50 sm:w-auto"
      >
        {state.status === "loading" ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} aria-hidden />}
        {t("submit")}
      </button>
    </form>
  );
}
