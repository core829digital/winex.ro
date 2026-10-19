"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

/** La disiscrizione avviene solo con un click esplicito (i filtri antispam aprono i link in automatico). */
export function UnsubscribeForm() {
  const t = useTranslations("forms.unsubscribe");
  const token = useSearchParams().get("t");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

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
            const r = await fetch("/api/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
            setState(r.ok ? "done" : "error");
          } catch {
            setState("error");
          }
        }}
        className="mt-6 inline-flex rounded-[var(--r-btn)] bg-red px-6 py-3.5 font-semibold text-white transition-colors hover:bg-red-deep disabled:opacity-60"
      >
        {t("button")}
      </button>
      {state === "error" && <p role="alert" className="mt-4 text-sm font-medium text-red-deep">{t("error")}</p>}
    </div>
  );
}
