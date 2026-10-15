import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertIngestSecret, requireAdmin } from "./lib/admin";

export const saveSubscription = mutation({
  args: { endpoint: v.string(), p256dh: v.string(), auth: v.string(), userAgent: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const admin = await requireAdmin(ctx);
    if (!a.endpoint.startsWith("https://") || a.endpoint.length > 1000) throw new Error("INVALID_ENDPOINT");
    const existing = await ctx.db.query("pushSubscriptions").withIndex("by_endpoint", (q) => q.eq("endpoint", a.endpoint)).first();
    if (existing) {
      await ctx.db.patch(existing._id, { p256dh: a.p256dh, auth: a.auth, userId: admin.userId });
      return;
    }
    await ctx.db.insert("pushSubscriptions", { ...a, userId: admin.userId, createdAt: Date.now() });
  },
});

export const removeSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const admin = await requireAdmin(ctx);
    const s = await ctx.db.query("pushSubscriptions").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).first();
    if (s && s.userId === admin.userId) await ctx.db.delete(s._id);
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const rows = await ctx.db.query("pushSubscriptions").withIndex("by_user", (q) => q.eq("userId", admin.userId)).take(20);
    return rows.map((r) => ({ endpoint: r.endpoint, userAgent: r.userAgent, createdAt: r.createdAt }));
  },
});

export const listForServer = query({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    assertIngestSecret(secret);
    return await ctx.db.query("pushSubscriptions").take(100);
  },
});

export const removeGone = mutation({
  args: { secret: v.string(), endpoint: v.string() },
  handler: async (ctx, { secret, endpoint }) => {
    assertIngestSecret(secret);
    const s = await ctx.db.query("pushSubscriptions").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).first();
    if (s) await ctx.db.delete(s._id);
  },
});
