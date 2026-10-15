import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { assertIngestSecret } from "./_auth";

export const subscribe = mutationGeneric({
  args: { secret: v.string(), email: v.string(), source: v.string(), consent: v.boolean() },
  handler: async (ctx, { secret, email, source, consent }) => {
    assertIngestSecret(secret);
    const normalized = email.trim().toLowerCase();
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    if (existing) return { id: existing._id, created: false };
    const id = await ctx.db.insert("subscribers", {
      email: normalized,
      source,
      consent,
      subscribedAt: Date.now(),
    });
    return { id, created: true };
  },
});
