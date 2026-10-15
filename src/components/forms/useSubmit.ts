"use client";

import { useState } from "react";

export type SubmitState = { status: "idle" | "loading" | "success" | "error"; message?: string };

/** Invio JSON a una route API con gestione stati/errori uniforme. */
export function useSubmit(endpoint: string) {
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  async function submit(payload: Record<string, unknown>) {
    setState({ status: "loading" });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "A apărut o eroare. Reîncearcă." });
        return false;
      }
      setState({ status: "success" });
      return true;
    } catch {
      setState({ status: "error", message: "Conexiune indisponibilă. Verifică internetul și reîncearcă." });
      return false;
    }
  }
  return { state, submit };
}
