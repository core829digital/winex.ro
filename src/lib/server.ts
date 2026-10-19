import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { Resend } from "resend";
import { api } from "../../convex/_generated/api";
import { site } from "./site";

export const env = {
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
  ingestSecret: process.env.CONVEX_INGEST_SECRET,
  resendKey: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM,
  to: process.env.CONTACT_TO_EMAIL,
  audienceId: process.env.RESEND_AUDIENCE_ID,
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
  vapidPublic: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  vapidPrivate: process.env.VAPID_PRIVATE_KEY,
  vapidSubject: process.env.VAPID_SUBJECT,
  analyticsSalt: process.env.ANALYTICS_SALT ?? process.env.CONVEX_INGEST_SECRET,
};

export const convexReady = Boolean(env.convexUrl && env.ingestSecret);
export const resendReady = Boolean(env.resendKey && env.from);

/** La newsletter (doppia conferma) richiede Convex + Resend: senza, le sezioni/form non vengono mostrati. */
export const newsletterEnabled = () => convexReady && resendReady;

export { api };

export function convex() {
  return new ConvexHttpClient(env.convexUrl!);
}

export function resend() {
  return new Resend(env.resendKey!);
}

export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Blocca richieste cross-site (CSRF) e ricava l'IP del client. */
export function guard(req: Request): { ok: true; ip: string } | { ok: false } {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const o = new URL(origin).host;
      const allowed = new Set([new URL(site.url).host, req.headers.get("host") ?? ""]);
      if (!allowed.has(o)) return { ok: false };
    } catch {
      return { ok: false };
    }
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return { ok: true, ip };
}

export async function readJson(req: Request, maxBytes = 16_000): Promise<unknown | null> {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Impostazioni (contatti, destinatario notifiche) lette dal server in modo sicuro, con fallback ai default. */
export async function getServerSettings() {
  if (!convexReady) return { company: null, notifications: null };
  try {
    return await convex().query(api.settings.getServer, { secret: env.ingestSecret! });
  } catch (e) {
    console.error("[settings] Convex error", e);
    return { company: null, notifications: null };
  }
}
