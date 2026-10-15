import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { Resend } from "resend";
import { site } from "./site";

export const env = {
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
  ingestSecret: process.env.CONVEX_INGEST_SECRET,
  resendKey: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM,
  to: process.env.CONTACT_TO_EMAIL,
  audienceId: process.env.RESEND_AUDIENCE_ID,
};

export const convexReady = Boolean(env.convexUrl && env.ingestSecret);
export const resendReady = Boolean(env.resendKey && env.from);

export const refs = {
  createLead: makeFunctionReference<"mutation">("leads:create"),
  subscribe: makeFunctionReference<"mutation">("subscribers:subscribe"),
};

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
