import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { assertIngestSecret, requireAdmin } from "./lib/admin";

async function bump(ctx: MutationCtx, day: string, kind: string, key: string) {
  const row = await ctx.db
    .query("counters")
    .withIndex("by_day_kind_key", (q) => q.eq("day", day).eq("kind", kind).eq("key", key))
    .first();
  if (row) await ctx.db.patch(row._id, { n: row.n + 1 });
  else await ctx.db.insert("counters", { day, kind, key, n: 1 });
}

/** Registra un evento (solo dal server Next.js /api/collect). Nessun dato personale: vid = hash giornaliero. */
export const record = mutation({
  args: {
    secret: v.string(),
    type: v.union(v.literal("pv"), v.literal("click")),
    day: v.string(),
    hour: v.string(),
    vid: v.string(),
    path: v.string(),
    ref: v.optional(v.string()),
    device: v.string(),
    country: v.optional(v.string()),
    label: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    assertIngestSecret(a.secret);
    await ctx.db.insert("events", {
      t: Date.now(),
      type: a.type,
      vid: a.vid,
      path: a.path,
      ref: a.ref,
      device: a.device,
      country: a.country,
      label: a.label,
    });

    const seen = await ctx.db
      .query("visitorDays")
      .withIndex("by_day_vid", (q) => q.eq("day", a.day).eq("vid", a.vid))
      .first();
    if (!seen) {
      await ctx.db.insert("visitorDays", { day: a.day, vid: a.vid });
      await bump(ctx, a.day, "visitors", "total");
      await bump(ctx, a.day, "device", a.device);
      if (a.country) await bump(ctx, a.day, "country", a.country);
      await bump(ctx, a.day, "ref", a.ref ?? "direct");
    }
    if (a.type === "pv") {
      await bump(ctx, a.day, "views", "total");
      await bump(ctx, a.day, "path", a.path);
      await bump(ctx, a.day, "h", a.hour);
    } else if (a.label) {
      await bump(ctx, a.day, "click", a.label);
    }
  },
});

/** Dati in tempo reale. `since` (ms) è passato dal client e aggiornato ogni ~10s (le query non leggono l'ora). */
export const live = query({
  args: { since: v.number() },
  handler: async (ctx, { since }) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("events").withIndex("by_t", (q) => q.gte("t", since)).order("desc").take(400);
    const visitors = new Set(rows.map((r) => r.vid));
    const pages = new Map<string, Set<string>>();
    for (const r of rows) {
      const s = pages.get(r.path) ?? new Set<string>();
      s.add(r.vid);
      pages.set(r.path, s);
    }
    return {
      activeVisitors: visitors.size,
      pagesNow: [...pages.entries()].map(([path, s]) => ({ path, visitors: s.size })).sort((a, b) => b.visitors - a.visitors).slice(0, 8),
      feed: rows.slice(0, 40).map((r) => ({
        t: r.t,
        type: r.type,
        path: r.path,
        label: r.label,
        ref: r.ref,
        device: r.device,
        country: r.country,
      })),
    };
  },
});

/** Riepilogo per intervallo di giorni (stringhe YYYY-MM-DD, calcolate dal client in Europe/Bucharest). */
export const overview = query({
  args: { from: v.string(), today: v.string() },
  handler: async (ctx, { from, today }) => {
    await requireAdmin(ctx);
    const read = async (kind: string) =>
      await ctx.db.query("counters").withIndex("by_kind_day", (q) => q.eq("kind", kind).gte("day", from)).take(3000);

    const [views, visitors, paths, refs, devices, countries, clicks, hours] = await Promise.all([
      read("views"),
      read("visitors"),
      read("path"),
      read("ref"),
      read("device"),
      read("country"),
      read("click"),
      ctx.db.query("counters").withIndex("by_kind_day", (q) => q.eq("kind", "h").eq("day", today)).take(48),
    ]);

    const sum = (rows: { n: number }[]) => rows.reduce((a, r) => a + r.n, 0);
    const group = (rows: { key: string; n: number }[], limit = 8) => {
      const m = new Map<string, number>();
      for (const r of rows) m.set(r.key, (m.get(r.key) ?? 0) + r.n);
      return [...m.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n).slice(0, limit);
    };
    const byDay = (rows: { day: string; n: number }[]) => {
      const m: Record<string, number> = {};
      for (const r of rows) m[r.day] = (m[r.day] ?? 0) + r.n;
      return m;
    };

    return {
      totals: {
        views: sum(views),
        visitors: sum(visitors),
        clicks: sum(clicks),
        viewsToday: views.filter((r) => r.day === today).reduce((a, r) => a + r.n, 0),
        visitorsToday: visitors.filter((r) => r.day === today).reduce((a, r) => a + r.n, 0),
      },
      daily: { views: byDay(views), visitors: byDay(visitors) },
      hourly: Object.fromEntries(hours.map((r) => [r.key, r.n])),
      topPages: group(paths, 10),
      refs: group(refs),
      devices: group(devices),
      countries: group(countries),
      clicks: group(clicks, 10),
    };
  },
});

/** Pulizia giornaliera: eventi grezzi > 3 giorni, visitatori-giorno > 3 giorni. */
export const prune = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const old = await ctx.db.query("events").withIndex("by_t", (q) => q.lt("t", cutoff)).take(500);
    for (const e of old) await ctx.db.delete(e._id);
    const days = new Date(cutoff).toISOString().slice(0, 10);
    const vd = await ctx.db.query("visitorDays").withIndex("by_day_vid", (q) => q.lt("day", days)).take(500);
    for (const r of vd) await ctx.db.delete(r._id);
    if (old.length === 500 || vd.length === 500) await ctx.scheduler.runAfter(1000, internal.analytics.prune, {});
  },
});
