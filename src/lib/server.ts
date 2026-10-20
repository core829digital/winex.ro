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

const TOOL_UA = /^(?:curl|wget|python|go-http|java|okhttp|libwww|scrapy|httpclient|postman|insomnia|axios|node-fetch|undici|aiohttp|httpie)\b/i;

/**
 * Guardia rigorosa per i moduli pubblici: Origin coerente (obbligatorio per i POST), Sec-Fetch-Site non cross-site,
 * User-Agent presente e non di uno strumento da riga di comando. Restituisce anche l'IP del client.
 */
export function guardStrict(req: Request, opts: { requireOrigin?: boolean } = {}): { ok: true; ip: string; ua: string } | { ok: false } {
  const base = guard(req);
  if (!base.ok) return base;
  const { requireOrigin = true } = opts;
  if (requireOrigin && !req.headers.get("origin")) return { ok: false };
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") return { ok: false };
  const ua = req.headers.get("user-agent")?.trim() ?? "";
  if (ua.length < 8 || ua.length > 400 || TOOL_UA.test(ua)) return { ok: false };
  return { ok: true, ip: base.ip, ua };
}

/** Verifica Cloudflare Turnstile (gratuito). Se TURNSTILE_SECRET_KEY non è impostata il controllo è disattivato. */
export const turnstileEnabled = Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || token.length < 10 || token.length > 2048) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, ...(ip !== "unknown" ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error("[turnstile] verifica non riuscita", e);
    return false; // fail closed
  }
}
