import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { assertIngestSecret, audit, requireAdmin } from "./lib/admin";

export const company = v.object({
  legalName: v.string(),
  cui: v.string(),
  regCom: v.string(),
  address: v.string(),
  phone: v.string(),
  email: v.string(),
  hours: v.string(),
  facebook: v.string(),
  instagram: v.string(),
  linkedin: v.string(),
});

export const notifications = v.object({
  leadEmailTo: v.string(), // se vuoto usa CONTACT_TO_EMAIL
  pushOnLead: v.boolean(),
  pushOnSubscriber: v.boolean(),
});

async function read(ctx: QueryCtx, key: string) {
  const row = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", key)).first();
  return row?.value ?? null;
}

export const getAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return { company: await read(ctx, "company"), notifications: await read(ctx, "notifications") };
  },
});

async function upsert(ctx: MutationCtx, key: string, value: unknown) {
  const row = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", key)).first();
  if (row) await ctx.db.patch(row._id, { value, updatedAt: Date.now() });
  else await ctx.db.insert("settings", { key, value, updatedAt: Date.now() });
}

export const saveCompany = mutation({
  args: { value: company },
  handler: async (ctx, { value }) => {
    const admin = await requireAdmin(ctx);
    for (const s of Object.values(value)) if (s.length > 400) throw new ConvexError("TOO_LONG");
    await upsert(ctx, "company", value);
    await audit(ctx, admin.email, "settings.company");
  },
});

export const saveNotifications = mutation({
  args: { value: notifications },
  handler: async (ctx, { value }) => {
    const admin = await requireAdmin(ctx);
    if (value.leadEmailTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.leadEmailTo)) throw new ConvexError("INVALID_EMAIL");
    await upsert(ctx, "notifications", value);
    await audit(ctx, admin.email, "settings.notifications");
  },
});

/** Lettura per il server Next.js (footer, contatti, pagine legali, destinatario notifiche). */
export const getServer = query({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    assertIngestSecret(secret);
    return { company: await read(ctx, "company"), notifications: await read(ctx, "notifications") };
  },
});
