"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2, Lock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Btn, Field, Input } from "@/components/admin/ui";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn("resend-otp", { email: email.trim().toLowerCase() });
      setStep("code");
    } catch {
      setError("Nu am putut trimite codul. Reîncearcă peste câteva momente.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await signIn("resend-otp", { email: email.trim().toLowerCase(), code: code.trim() });
      if (r.signingIn) router.replace("/admin");
      else setError("Cod incorect sau expirat.");
    } catch {
      setError("Cod incorect sau expirat.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg-soft p-4">
      <div className="w-full max-w-sm rounded-3xl border border-black/[0.07] bg-white p-8 shadow-[0_20px_50px_-24px_rgba(37,40,45,0.3)]">
        <Logo />
        <h1 className="mt-6 flex items-center gap-2 text-2xl font-extrabold">
          <Lock size={20} className="text-red" /> Acces administrare
        </h1>
        {step === "email" ? (
          <form onSubmit={requestCode} className="mt-5 space-y-4">
            <p className="text-sm text-ink-soft">Introdu adresa de e-mail autorizată. Îți trimitem un cod de acces.</p>
            <Field label="E-mail">
              <Input type="email" required autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nume@firma.ro" />
            </Field>
            <Btn variant="primary" type="submit" disabled={busy} className="w-full">
              {busy && <Loader2 size={16} className="animate-spin" />} Trimite codul
            </Btn>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-5 space-y-4">
            <p className="text-sm text-ink-soft">
              Dacă adresa este autorizată, am trimis un cod de 8 cifre la <b>{email}</b>. Este valabil 10 minute.
            </p>
            <Field label="Cod de acces">
              <Input
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{8}"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="12345678"
                className="text-center text-lg tracking-[0.4em]"
              />
            </Field>
            <Btn variant="primary" type="submit" disabled={busy || code.length !== 8} className="w-full">
              {busy && <Loader2 size={16} className="animate-spin" />} Intră
            </Btn>
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }} className="w-full text-center text-xs font-semibold text-ink-mute hover:text-ink">
              Folosește altă adresă
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-soft px-3.5 py-2.5 text-sm font-medium text-red-deep">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
