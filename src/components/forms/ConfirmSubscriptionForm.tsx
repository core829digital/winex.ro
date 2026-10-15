"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

type State = "idle" | "loading" | "done" | "expired" | "invalid" | "error";

/** Conferma solo con un click esplicito (i filtri antispam aprono i link in automatico: non devono confermare al posto tuo). */
export function ConfirmSubscriptionForm() {
  const token = useSearchParams().get("t");
  const [state, setState] = useState<State>("idle");

  if (!token) return <p className="mt-4 text-ink-soft">Link invalid. Folosește linkul din e-mailul de confirmare.</p>;
  if (state === "done")
    return (
      <p role="status" className="mt-4 text-ink-soft">
        Mulțumim! Abonarea ta este confirmată. Te așteaptă un e-mail de bun venit.
      </p>
    );

  return (
    <div className="mt-4">
      <p className="text-ink-soft">Apasă butonul pentru a confirma că vrei să primești newsletterul Winex.</p>
      <button
        type="button"
        disabled={state === "loading"}
        onClick={async () => {
          setState("loading");
          try {
            const r = await fetch("/api/newsletter/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });
            setState(r.ok ? "done" : r.status === 410 ? "expired" : r.status === 404 || r.status === 400 ? "invalid" : "error");
          } catch {
            setState("error");
          }
        }}
        className="mt-6 inline-flex rounded-full bg-red px-6 py-3.5 font-semibold text-white transition hover:bg-red-deep disabled:opacity-60"
      >
        Confirmă abonarea
      </button>
      {state === "expired" && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-deep">
          Linkul a expirat. Te rugăm să te abonezi din nou din pagina principală.
        </p>
      )}
      {state === "invalid" && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-deep">
          Linkul nu este valid sau a fost deja folosit.
        </p>
      )}
      {state === "error" && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-deep">
          A apărut o eroare. Încearcă din nou.
        </p>
      )}
    </div>
  );
}
