import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { leadStatus } from "./schema";
import { assertIngestSecret, audit, requireAdmin } from "./lib/admin";
import { normalizeLocale } from "./lib/locales";

/** Chiamata solo dal server Next.js (segreto condiviso). */
export const create = mutation({
  args: {
    secret: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    source: v.string(),
    locale: v.optional(v.string()),
    consent: v.boolean(),
  },
  handler: async (ctx, { secret, locale, ...lead }) => {
    assertIngestSecret(secret);
    // Difesa in profondità: anche con il segreto, nessun valore fuori misura o con markup entra nel database.
    if (lead.name.length > 120 || lead.email.length > 254 || lead.message.length > 4000 || (lead.subject?.length ?? 0) > 160 || (lead.phone?.length ?? 0) > 30 || lead.source.length > 40)
      throw new ConvexError("INVALID_INPUT");
    if (/[<>]/.test(`${lead.name}${lead.subject ?? ""}${lead.phone ?? ""}`)) throw new ConvexError("INVALID_INPUT");
    return await ctx.db.insert("leads", { ...lead, locale: locale ? normalizeLocale(locale) : undefined, status: "new", createdAt: Date.now() });
  },
});

export const list = query({
  args: { status: v.optional(leadStatus) },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    const q = status
      ? ctx.db.query("leads").withIndex("by_status_createdAt", (i) => i.eq("status", status))
      : ctx.db.query("leads").withIndex("by_createdAt");
    return await q.order("desc").take(300);
  },
});

/** Numero di messaggi nuovi (badge + notifica live). */
export const newCount = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("leads")
      .withIndex("by_status_createdAt", (i) => i.eq("status", "new"))
      .order("desc")
      .take(100);
    return { count: rows.length, latestAt: rows[0]?.createdAt ?? 0, latestName: rows[0]?.name ?? null };
  },
});

export const setStatus = mutation({
  args: { id: v.id("leads"), status: leadStatus },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { status });
  },
});

export const setNote = mutation({
  args: { id: v.id("leads"), note: v.string() },
  handler: async (ctx, { id, note }) => {
    await requireAdmin(ctx);
    if (note.length > 4000) throw new ConvexError("NOTE_TOO_LONG");
    await ctx.db.patch(id, { note: note.trim() || undefined });
  },
});

export const remove = mutation({
  args: { id: v.id("leads") },
  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.delete(id);
    await audit(ctx, admin.email, "lead.delete", id);
  },
});
