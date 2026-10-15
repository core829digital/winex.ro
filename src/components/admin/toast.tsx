"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

type Kind = "ok" | "error" | "info";
type Toast = { id: number; kind: Kind; text: string };
const Ctx = createContext<(text: string, kind?: Kind) => void>(() => undefined);

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Kind = "ok") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-3), { id, kind, text }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 5000);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-20 z-[80] flex flex-col items-center gap-2 md:bottom-6 md:items-end md:right-6 md:left-auto">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium shadow-[0_12px_32px_-12px_rgba(37,40,45,0.35)]"
          >
            {t.kind === "ok" ? <CheckCircle2 size={18} className="text-emerald-600" /> : t.kind === "error" ? <AlertTriangle size={18} className="text-red" /> : <Info size={18} className="text-ink-mute" />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/** Messaggio leggibile da un errore Convex (ConvexError) o generico. */
export function errMsg(e: unknown): string {
  const data = (e as { data?: unknown })?.data;
  const code = typeof data === "string" ? data : undefined;
  const map: Record<string, string> = {
    UNAUTHENTICATED: "Sesiune expirată. Autentifică-te din nou.",
    FORBIDDEN: "Nu ai permisiuni.",
    LOCKED: "Campania nu mai poate fi modificată în starea curentă.",
    EMPTY: "Subiectul și conținutul sunt obligatorii.",
    TOO_LONG: "Textul este prea lung.",
    INVALID_CTA_URL: "Linkul butonului nu este valid (https://…).",
    TEST_ONLY_TO_ADMINS: "Testul se poate trimite doar la adrese de administrator.",
    SLUG_TAKEN: "Există deja un articol cu acest slug.",
    TITLE_REQUIRED: "Titlul este obligatoriu.",
    INVALID_EMAIL: "Adresa de e-mail nu este validă.",
    ALREADY_EXISTS: "Adresa există deja.",
    CONSENT_REQUIRED: "Confirmă că ai consimțământul persoanei.",
    NOT_ALLOWED: "Operațiunea nu este permisă.",
    NOT_SCHEDULED: "Campania nu este programată.",
  };
  return (code && map[code]) || "A apărut o eroare. Reîncearcă.";
}
