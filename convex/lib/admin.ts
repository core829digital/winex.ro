import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/** Email amministratori autorizzati: variabile ADMIN_EMAILS (separate da virgola) in Convex. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

/** Richiede sessione valida E email presente nella lista autorizzata. Da chiamare in ogni funzione admin. */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("UNAUTHENTICATED");
  const user = await ctx.db.get(userId);
  if (!user || !isAdminEmail(user.email)) throw new ConvexError("FORBIDDEN");
  return { userId, email: user.email!.toLowerCase() };
}

/**
 * Le funzioni di ingestione (chiamate solo dal server Next.js) richiedono un segreto condiviso
 * (INGEST_SECRET in Convex = CONVEX_INGEST_SECRET in Next). Confronto a tempo costante.
 */
export function assertIngestSecret(secret: string) {
  const expected = process.env.INGEST_SECRET;
  if (!expected || expected.length < 16) throw new Error("INGEST_SECRET non configurato in Convex");
  let diff = secret.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ (secret.charCodeAt(i) || 0);
  if (diff !== 0) throw new Error("Unauthorized");
}

export async function audit(ctx: MutationCtx, actor: string, action: string, target?: string) {
  await ctx.db.insert("auditLog", { at: Date.now(), actor, action, target });
}

export function randomToken(bytes = 16): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
