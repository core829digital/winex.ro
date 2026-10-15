import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { assertIngestSecret } from "./_auth";

export const create = mutationGeneric({
  args: {
    secret: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    source: v.string(),
    consent: v.boolean(),
  },
  handler: async (ctx, { secret, ...lead }) => {
    assertIngestSecret(secret);
    return await ctx.db.insert("leads", { ...lead, createdAt: Date.now() });
  },
});
