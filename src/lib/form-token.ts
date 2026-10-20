import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Token di modulo firmato (HMAC-SHA256): `v1.<emessoA>.<nonce>.<hashUA>.<firma>`.
 * Dimostra che il modulo è stato caricato da un browser, non prima di MIN_AGE (i bot inviano subito),
 * non oltre MAX_AGE, dallo stesso User-Agent, e una sola volta (nonce monouso, per istanza).
 */
export const MIN_AGE_MS = 2_000;
export const MAX_AGE_MS = 2 * 60 * 60_000;

const used = new Map<string, number>();
let ephemeral: string | null = null;

function secret(): string | null {
  const explicit = process.env.FORM_SIGNING_SECRET || process.env.CONVEX_INGEST_SECRET;
  if (explicit) return explicit;
  if (process.env.RESEND_API_KEY) return createHash("sha256").update(`winex-form-v1:${process.env.RESEND_API_KEY}`).digest("hex");
  if (process.env.NODE_ENV !== "production") return (ephemeral ??= randomBytes(32).toString("hex"));
  return null; // in produzione senza segreti: il modulo si rifiuta (fail closed)
}

const uaHash = (ua: string) => createHash("sha256").update(ua).digest("hex").slice(0, 12);
const sign = (key: string, body: string) => createHmac("sha256", key).update(body).digest("base64url");

export function formTokenAvailable(): boolean {
  return secret() !== null;
}

export function issueFormToken(userAgent: string, now = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const body = `v1.${now.toString(36)}.${randomBytes(9).toString("base64url")}.${uaHash(userAgent)}`;
  return `${body}.${sign(key, body)}`;
}

export type TokenCheck = { ok: true } | { ok: false; reason: "missing" | "malformed" | "signature" | "too_fast" | "expired" | "agent" | "replay" };

export function verifyFormToken(token: unknown, userAgent: string, now = Date.now()): TokenCheck {
  const key = secret();
  if (!key || typeof token !== "string" || token.length > 300) return { ok: false, reason: "missing" };
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== "v1") return { ok: false, reason: "malformed" };
  const [, iat, nonce, ua, sig] = parts;
  const expected = sign(key, `v1.${iat}.${nonce}.${ua}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "signature" };
  const issued = parseInt(iat, 36);
  if (!Number.isFinite(issued) || issued > now) return { ok: false, reason: "malformed" };
  const age = now - issued;
  if (age < MIN_AGE_MS) return { ok: false, reason: "too_fast" };
  if (age > MAX_AGE_MS) return { ok: false, reason: "expired" };
  if (ua !== uaHash(userAgent)) return { ok: false, reason: "agent" };

  for (const [n, t] of used) if (now - t > MAX_AGE_MS) used.delete(n);
  if (used.has(nonce)) return { ok: false, reason: "replay" };
  used.set(nonce, now);
  return { ok: true };
}
