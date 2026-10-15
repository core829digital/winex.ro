import { v, ConvexError } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { subscriberStatus } from "./schema";
import { assertIngestSecret, audit, randomToken, requireAdmin } from "./lib/admin";

const CONFIRM_THROTTLE_MS = 10 * 60_000; // max 1 email di conferma ogni 10 minuti per indirizzo
const CONFIRM_TTL_MS = 7 * 24 * 60 * 60_000; // il link di conferma vale 7 giorni
const PENDING_RETENTION_MS = 30 * 24 * 60 * 60_000; // richieste non confermate: cancellate dopo 30 giorni

/**
 * Richiesta di iscrizione dal sito (server Next.js) — DOUBLE OPT-IN.
 * Crea/aggiorna un iscritto "pending" e dice al chiamante se deve inviare l'email di conferma.
 * Nessun iscritto diventa "subscribed" senza cliccare il link di conferma.
 * La risposta non rivela se l'indirizzo era già iscritto (anti-enumerazione): il chiamante risponde sempre uguale.
 */
export const subscribe = mutation({
  args: { secret: v.string(), email: v.string(), source: v.string(), consent: v.boolean() },
  handler: async (ctx, { secret, email, source, consent }): Promise<{ send: boolean; confirmToken?: string }> => {
    assertIngestSecret(secret);
    if (!consent) throw new ConvexError("CONSENT_REQUIRED");
    const normalized = email.trim().toLowerCase();
    const now = Date.now();
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();

    if (!existing) {
      const confirmToken = randomToken();
      await ctx.db.insert("subscribers", {
        email: normalized,
        source,
        consent: true,
        status: "pending",
        unsubToken: randomToken(),
        confirmToken,
        confirmSentAt: now,
        subscribedAt: now,
      });
      return { send: true, confirmToken };
    }
    // già attivo o bloccato (bounce/reclamo): nessuna email, nessuna modifica
    if (existing.status === "subscribed" || existing.status === "suppressed") return { send: false };
    // in attesa: non ripetere l'invio troppo spesso
    if (existing.status === "pending" && existing.confirmSentAt && now - existing.confirmSentAt < CONFIRM_THROTTLE_MS) {
      return { send: false };
    }
    // in attesa (scaduta/da reinviare) o disiscritto che si riscrive → nuova conferma obbligatoria
    const confirmToken = randomToken();
    await ctx.db.patch(existing._id, {
      status: "pending",
      consent: true,
      confirmToken,
      confirmSentAt: now,
      subscribedAt: now,
      unsubscribedAt: undefined,
    });
    return { send: true, confirmToken };
  },
});

/** Conferma tramite link dell'email (richiesta esplicita dalla pagina /confirma-abonare). */
export const confirmByToken = mutation({
  args: { secret: v.string(), token: v.string() },
  handler: async (
    ctx,
    { secret, token },
  ): Promise<{ ok: boolean; reason?: "invalid" | "expired"; firstTime?: boolean; email?: string; unsubToken?: string }> => {
    assertIngestSecret(secret);
    if (token.length < 16 || token.length > 64) return { ok: false, reason: "invalid" };
    const sub = await ctx.db
      .query("subscribers")
      .withIndex("by_confirmToken", (q) => q.eq("confirmToken", token))
      .first();
    if (!sub || sub.status !== "pending") return { ok: false, reason: "invalid" };
    if (!sub.confirmSentAt || Date.now() - sub.confirmSentAt > CONFIRM_TTL_MS) return { ok: false, reason: "expired" };
    await ctx.db.patch(sub._id, { status: "subscribed", confirmedAt: Date.now(), confirmToken: undefined });
    return { ok: true, firstTime: true, email: sub.email, unsubToken: sub.unsubToken };
  },
});

/** Pulizia giornaliera: richieste mai confermate oltre 30 giorni (minimizzazione dei dati, GDPR). */
export const pruneUnconfirmed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - PENDING_RETENTION_MS;
    const rows = await ctx.db
      .query("subscribers")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(500);
    let n = 0;
    for (const r of rows) {
      if ((r.confirmSentAt ?? r.subscribedAt) < cutoff) {
        await ctx.db.delete(r._id);
        n++;
      }
    }
    return n;
  },
});

export const unsubscribeByToken = mutation({
  args: { secret: v.string(), token: v.string() },
  handler: async (ctx, { secret, token }) => {
    assertIngestSecret(secret);
    if (token.length < 16 || token.length > 64) return { ok: false };
    const sub = await ctx.db
      .query("subscribers")
      .withIndex("by_token", (q) => q.eq("unsubToken", token))
      .first();
    if (!sub) return { ok: false };
    if (sub.status === "subscribed") {
      await ctx.db.patch(sub._id, { status: "unsubscribed", unsubscribedAt: Date.now() });
    }
    return { ok: true };
  },
});

/** Bounce / reclamo spam da webhook Resend. */
export const suppressByEmail = mutation({
  args: { secret: v.string(), email: v.string() },
  handler: async (ctx, { secret, email }) => {
    assertIngestSecret(secret);
    const sub = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", email.trim().toLowerCase()))
      .first();
    if (sub && sub.status === "subscribed") await ctx.db.patch(sub._id, { status: "suppressed" });
  },
});

export const list = query({
  args: { status: v.optional(subscriberStatus) },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    const q = status
      ? ctx.db.query("subscribers").withIndex("by_status", (i) => i.eq("status", status))
      : ctx.db.query("subscribers");
    const rows = await q.order("desc").take(1000);
    // il token di disiscrizione non lascia mai il server verso l'admin UI
    return rows.map((r) => ({
      _id: r._id,
      email: r.email,
      status: r.status,
      source: r.source,
      consent: r.consent,
      subscribedAt: r.subscribedAt,
      confirmedAt: r.confirmedAt,
      unsubscribedAt: r.unsubscribedAt,
    }));
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const count = async (status: "pending" | "subscribed" | "unsubscribed" | "suppressed") =>
      (await ctx.db.query("subscribers").withIndex("by_status", (i) => i.eq("status", status)).take(20000)).length;
    return {
      pending: await count("pending"),
      subscribed: await count("subscribed"),
      unsubscribed: await count("unsubscribed"),
      suppressed: await count("suppressed"),
    };
  },
});

export const adminAdd = mutation({
  args: { email: v.string(), consentConfirmed: v.boolean() },
  handler: async (ctx, { email, consentConfirmed }) => {
    const admin = await requireAdmin(ctx);
    if (!consentConfirmed) throw new ConvexError("CONSENT_REQUIRED");
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new ConvexError("INVALID_EMAIL");
    const existing = await ctx.db.query("subscribers").withIndex("by_email", (q) => q.eq("email", normalized)).first();
    if (existing) throw new ConvexError("ALREADY_EXISTS");
    await ctx.db.insert("subscribers", {
      email: normalized,
      source: "admin",
      consent: true,
      status: "subscribed",
      unsubToken: randomToken(),
      subscribedAt: Date.now(),
    });
    await audit(ctx, admin.email, "subscriber.add", normalized);
  },
});

export const adminSetStatus = mutation({
  args: { id: v.id("subscribers"), status: subscriberStatus },
  handler: async (ctx, { id, status }) => {
    const admin = await requireAdmin(ctx);
    // Riattivare o "confermare" al posto della persona non è consentito: serve il suo consenso (link di conferma).
    if (status === "subscribed" || status === "pending") throw new ConvexError("NOT_ALLOWED");
    await ctx.db.patch(id, { status, unsubscribedAt: Date.now() });
    await audit(ctx, admin.email, `subscriber.${status}`, id);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("subscribers") },
  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.delete(id);
    await audit(ctx, admin.email, "subscriber.delete", id);
  },
});

/** Pagina di destinatari attivi (per l'invio campagne). */
export const recipientsPage = internalQuery({
  args: { after: v.optional(v.number()), limit: v.number() },
  handler: async (ctx, { after, limit }) => {
    const rows = await ctx.db
      .query("subscribers")
      .withIndex("by_status", (i) => i.eq("status", "subscribed").gt("_creationTime", after ?? 0))
      .take(limit);
    return rows.map((r) => ({ email: r.email, token: r.unsubToken, ct: r._creationTime }));
  },
});

export const activeCount = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("subscribers").withIndex("by_status", (i) => i.eq("status", "subscribed")).take(20000)).length;
  },
});
