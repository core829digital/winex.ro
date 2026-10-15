import { Email } from "@convex-dev/auth/providers/Email";
import { isAdminEmail } from "./lib/admin";

/** 8 cifre uniformi (rejection sampling) generate con CSPRNG. */
function otp(len = 8): string {
  let out = "";
  const buf = new Uint8Array(1);
  while (out.length < len) {
    crypto.getRandomValues(buf);
    if (buf[0] < 250) out += String(buf[0] % 10);
  }
  return out;
}

/**
 * Login admin con codice monouso via email (Resend).
 * - Il codice viene inviato SOLO se l'email è nella lista ADMIN_EMAILS (altrimenti nessun invio,
 *   nessuna differenza di risposta: niente enumerazione degli account).
 * - Validità 10 minuti; i tentativi errati sono limitati da Convex Auth.
 */
export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 10,
  async generateVerificationToken() {
    return otp(8);
  },
  async sendVerificationRequest({ identifier, token, provider }) {
    const email = identifier.trim().toLowerCase();
    if (!isAdminEmail(email)) return;

    if (!provider.apiKey) {
      if (process.env.AUTH_DEBUG_LOG_OTP === "true") console.log(`[auth] OTP per ${email}: ${token}`);
      else throw new Error("AUTH_RESEND_KEY non configurata");
      return;
    }
    const from = process.env.RESEND_FROM ?? "Winex <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Codice di accesso Winex: ${token}`,
        text: `Codul tău de acces Winex Admin este: ${token}\n\nEste valabil 10 minute. Dacă nu l-ai solicitat tu, ignoră acest mesaj.`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto;padding:24px;color:#25282d"><h2 style="margin:0 0 12px">Winex Admin</h2><p>Codul tău de acces:</p><p style="font-size:34px;letter-spacing:6px;font-weight:800;margin:12px 0;color:#dc2430">${token}</p><p style="color:#6f7681;font-size:13px">Valabil 10 minute. Dacă nu l-ai solicitat tu, ignoră acest mesaj.</p></div>`,
      }),
    });
    if (!res.ok) throw new Error(`Resend: ${res.status}`);
  },
});
