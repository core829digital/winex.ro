"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useSubmit } from "./useSubmit";

const field =
  "w-full rounded-2xl border border-black/[0.08] bg-white/70 px-4 py-3.5 text-ink outline-none transition placeholder:text-ink-mute focus:border-red focus:bg-white focus:ring-4 focus:ring-red/10";

export function ContactForm({ source = "contact", defaultMessage = "" }: { source?: string; defaultMessage?: string }) {
  const id = useId();
  const { state, submit } = useSubmit("/api/contact");
  const [consent, setConsent] = useState(false);

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-red-soft text-red">
          <CheckCircle2 size={34} />
        </span>
        <h3 className="text-2xl font-extrabold">Mesaj trimis!</h3>
        <p className="max-w-sm text-ink-soft">Mulțumim. Revenim către tine cât mai curând posibil.</p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void submit({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          subject: fd.get("subject") || undefined,
          message: fd.get("message"),
          consent,
          website: fd.get("website"),
          source,
        });
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm font-semibold">Nume *</label>
          <input id={`${id}-name`} name="name" required autoComplete="name" className={field} placeholder="Numele tău" />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="mb-1.5 block text-sm font-semibold">E-mail *</label>
          <input id={`${id}-email`} name="email" type="email" required autoComplete="email" className={field} placeholder="adresa@ta.ro" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-phone`} className="mb-1.5 block text-sm font-semibold">Telefon</label>
          <input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" className={field} placeholder="+40 …" />
        </div>
        <div>
          <label htmlFor={`${id}-subject`} className="mb-1.5 block text-sm font-semibold">Subiect</label>
          <input id={`${id}-subject`} name="subject" className={field} placeholder="Ofertă ferestre PVC…" />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-message`} className="mb-1.5 block text-sm font-semibold">Mesaj *</label>
        <textarea
          id={`${id}-message`}
          name="message"
          required
          rows={6}
          defaultValue={defaultMessage}
          className={`${field} resize-y`}
          placeholder="Spune-ne despre proiectul tău…"
        />
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--red)]"
        />
        <span>
          Sunt de acord cu prelucrarea datelor mele conform{" "}
          <Link href="/politica-confidentialitate" className="font-semibold text-red-deep underline underline-offset-2">
            Politicii de confidențialitate
          </Link>
          . *
        </span>
      </label>

      {state.status === "error" && (
        <p role="alert" className="rounded-2xl bg-red-soft px-4 py-3 text-sm font-medium text-red-deep">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={state.status === "loading" || !consent}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red px-6 py-4 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(220,36,48,0.65)] transition hover:bg-red-deep disabled:opacity-50 sm:w-auto"
      >
        {state.status === "loading" ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        Trimite mesajul
      </button>
    </form>
  );
}
