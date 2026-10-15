import { v, ConvexError } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { subscriberStatus } from "./schema";
import { assertIngestSecret, audit, randomToken, requireAdmin } from "./lib/admin";

/** Iscrizione dal sito (server Next.js). Non riattiva chi è "suppressed" (bounce/reclamo). */
export const subscribe = mutation({
  args: { secret: v.string(), email: v.string(), source: v.string(), consent: v.boolean() },
  handler: async (ctx, { secret, email, source, consent }) => {
    assertIngestSecret(secret);
    const normalized = email.trim().toLowerCase();
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    if (existing) {
      if (existing.status === "unsubscribed" && consent) {
        await ctx.db.patch(existing._id, { status: "subscribed", subscribedAt: Date.now(), consent: true });
        return { created: true, token: existing.unsubToken };
      }
      return { created: false, token: existing.unsubToken };
    }
    const token = randomToken();
    await ctx.db.insert("subscribers", {
      email: normalized,
      source,
      consent,
      status: "subscribed",
      unsubToken: token,
      subscribedAt: Date.now(),
    });
    return { created: true, token };
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
      unsubscribedAt: r.unsubscribedAt,
    }));
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const count = async (status: "subscribed" | "unsubscribed" | "suppressed") =>
      (await ctx.db.query("subscribers").withIndex("by_status", (i) => i.eq("status", status)).take(20000)).length;
    return {
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
    // Riattivare chi si è disiscritto richiederebbe un nuovo consenso: non consentito da admin.
    if (status === "subscribed") throw new ConvexError("NOT_ALLOWED");
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
