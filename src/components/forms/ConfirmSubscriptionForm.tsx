"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type State = "idle" | "loading" | "done" | "expired" | "invalid" | "error";

/** Conferma solo con un click esplicito (i filtri antispam aprono i link in automatico: non devono confermare al posto tuo). */
export function ConfirmSubscriptionForm() {
  const t = useTranslations("forms.confirm");
  const token = useSearchParams().get("t");
  const [state, setState] = useState<State>("idle");

  if (!token) return <p className="mt-4 text-ink-soft">{t("invalid")}</p>;
  if (state === "done") return <p role="status" className="mt-4 text-ink-soft">{t("done")}</p>;

  return (
    <div className="mt-4">
      <p className="text-ink-soft">{t("ask")}</p>
      <button
        type="button"
        disabled={state === "loading"}
        onClick={async () => {
          setState("loading");
          try {
            const r = await fetch("/api/newsletter/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
            setState(r.ok ? "done" : r.status === 410 ? "expired" : r.status === 404 || r.status === 400 ? "invalid" : "error");
          } catch {
            setState("error");
          }
        }}
        className="mt-6 inline-flex rounded-[var(--r-btn)] bg-red px-6 py-3.5 font-semibold text-white transition-colors hover:bg-red-deep disabled:opacity-60"
      >
        {t("button")}
      </button>
      {state === "expired" && <p role="alert" className="mt-4 text-sm font-medium text-red-deep">{t("expired")}</p>}
      {state === "invalid" && <p role="alert" className="mt-4 text-sm font-medium text-red-deep">{t("used")}</p>}
      {state === "error" && <p role="alert" className="mt-4 text-sm font-medium text-red-deep">{t("error")}</p>}
    </div>
  );
}
