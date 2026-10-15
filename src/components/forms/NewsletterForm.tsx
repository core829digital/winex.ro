"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useSubmit } from "./useSubmit";

export function NewsletterForm() {
  const id = useId();
  const { state, submit } = useSubmit("/api/newsletter");
  const [consent, setConsent] = useState(false);

  if (state.status === "success") {
    return (
      <div role="status" className="glass flex items-center justify-center gap-3 rounded-2xl px-6 py-5 text-ink">
        <CheckCircle2 className="text-red" />
        <span className="font-semibold">Aproape gata! Verifică-ți e-mailul și apasă linkul de confirmare.</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void submit({ email: fd.get("email"), consent, website: fd.get("website") });
      }}
      className="text-left"
      noValidate
    >
      <div className="glass-strong flex items-center gap-2 rounded-full p-1.5 pl-5">
        <label htmlFor={`${id}-email`} className="sr-only">
          Adresa de e-mail
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="adresa@ta.ro"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-ink outline-none placeholder:text-ink-mute"
        />
        {/* honeypot */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button
          type="submit"
          disabled={state.status === "loading" || !consent}
          className="inline-flex items-center gap-2 rounded-full bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-deep disabled:opacity-50"
        >
          {state.status === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Abonează-te"}
          {state.status !== "loading" && <ArrowRight size={16} />}
        </button>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs text-ink-soft">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--red)]"
        />
        <span>
          Sunt de acord să primesc e-mailuri de la Winex (vei primi un e-mail de confirmare) și am citit{" "}
          <Link href="/politica-confidentialitate" className="font-semibold text-red-deep underline underline-offset-2">
            Politica de confidențialitate
          </Link>
          .
        </span>
      </label>
      {state.status === "error" && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-deep">
          {state.message}
        </p>
      )}
    </form>
  );
}
