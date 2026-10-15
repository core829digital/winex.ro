"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

/** La disiscrizione avviene solo con un click esplicito (i filtri antispam aprono i link in automatico). */
export function UnsubscribeForm() {
  const token = useSearchParams().get("t");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  if (!token) {
    return <p className="mt-4 text-ink-soft">Link invalid. Folosește linkul de dezabonare din ultimul e-mail primit.</p>;
  }
  if (state === "done") {
    return (
      <p role="status" className="mt-4 text-ink-soft">
        Te-ai dezabonat cu succes. Nu vei mai primi e-mailuri de la noi.
      </p>
    );
  }
  return (
    <div className="mt-4">
      <p className="text-ink-soft">Confirmi că vrei să nu mai primești newsletterul Winex?</p>
      <button
        type="button"
        disabled={state === "loading"}
        onClick={async () => {
          setState("loading");
          try {
            const r = await fetch("/api/unsubscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });
            setState(r.ok ? "done" : "error");
          } catch {
            setState("error");
          }
        }}
        className="mt-6 inline-flex rounded-full bg-red px-6 py-3.5 font-semibold text-white transition hover:bg-red-deep disabled:opacity-60"
      >
        Confirmă dezabonarea
      </button>
      {state === "error" && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-deep">
          Linkul nu este valid sau a apărut o eroare. Încearcă din nou.
        </p>
      )}
    </div>
  );
}
