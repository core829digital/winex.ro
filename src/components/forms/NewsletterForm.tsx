"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSubmit } from "./useSubmit";

export function NewsletterForm() {
  const t = useTranslations("forms.newsletter");
  const e = useTranslations("forms.errors");
  const locale = useLocale();
  const id = useId();
  const { state, submit } = useSubmit("/api/newsletter");
  const [consent, setConsent] = useState(false);

  if (state.status === "success") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-[var(--r-card)] border border-line bg-white px-5 py-5 text-ink">
        <CheckCircle2 className="mt-0.5 shrink-0 text-red" aria-hidden />
        <span className="font-medium">{t("success")}</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        void submit({ email: fd.get("email"), consent, website: fd.get("website"), locale });
      }}
      noValidate
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`${id}-email`} className="sr-only">{t("emailLabel")}</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("placeholder")}
          className="min-w-0 flex-1 rounded-[var(--r-btn)] border border-[var(--line-strong)] bg-white px-4 py-3.5 text-ink outline-none transition placeholder:text-ink-mute focus:border-red focus:ring-4 focus:ring-red/10"
        />
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button
          type="submit"
          disabled={state.status === "loading" || !consent}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--r-btn)] bg-red px-6 py-3.5 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-red-deep disabled:opacity-50"
        >
          {state.status === "loading" ? <Loader2 size={17} className="animate-spin" /> : t("submit")}
          {state.status !== "loading" && <ArrowRight size={17} aria-hidden />}
        </button>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-ink-soft">
        <input type="checkbox" checked={consent} onChange={(ev) => setConsent(ev.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--red)]" />
        <span>
          {t.rich("consent", {
            link: (chunks) => (
              <Link href="/privacy" className="font-semibold text-red-deep underline underline-offset-2">{chunks}</Link>
            ),
          })}
        </span>
      </label>
      {state.status === "error" && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-deep">
          {e.has(state.code as never) ? e(state.code as never) : e("generic")}
        </p>
      )}
    </form>
  );
}
