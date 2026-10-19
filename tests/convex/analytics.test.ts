// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import { SECRET, asUser, makeT } from "./helpers";

const rec = (o: Partial<Parameters<ReturnType<typeof makeT>["mutation"]>[1]> & Record<string, unknown>) => ({
  secret: SECRET,
  type: "pv" as const,
  day: "2026-10-15",
  hour: "10",
  vid: "v1",
  path: "/",
  device: "mobile",
  ...o,
});

describe("analytics proprietarie", () => {
  it("conta viste, visitatori unici per giorno, click, sorgenti, dispositivi, ore", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    await t.mutation(api.analytics.record, rec({ vid: "v1", path: "/", ref: "google.com", country: "RO" }));
    await t.mutation(api.analytics.record, rec({ vid: "v1", path: "/contact", hour: "11" })); // stesso visitatore
    await t.mutation(api.analytics.record, rec({ vid: "v2", path: "/", device: "desktop", hour: "11" }));
    await t.mutation(api.analytics.record, rec({ vid: "v1", type: "click", path: "/", label: "buton: Configurează" }));
    await t.mutation(api.analytics.record, rec({ vid: "v3", day: "2026-10-14", path: "/fabrica" }));

    const o = await client.query(api.analytics.overview, { from: "2026-10-14", today: "2026-10-15" });
    expect(o.totals).toMatchObject({ views: 4, visitors: 3, clicks: 1, viewsToday: 3, visitorsToday: 2 });
    expect(o.daily.views).toEqual({ "2026-10-15": 3, "2026-10-14": 1 });
    expect(o.daily.visitors).toEqual({ "2026-10-15": 2, "2026-10-14": 1 });
    expect(o.topPages[0]).toEqual({ key: "/", n: 2 });
    expect(o.hourly).toEqual({ "10": 1, "11": 2 });
    expect(o.clicks).toEqual([{ key: "buton: Configurează", n: 1 }]);
    expect(o.refs.find((r) => r.key === "google.com")?.n).toBe(1);
    expect(o.devices.find((r) => r.key === "desktop")?.n).toBe(1);
    expect(o.countries).toEqual([{ key: "RO", n: 1 }]);

    // il filtro "from" esclude i giorni precedenti
    const o2 = await client.query(api.analytics.overview, { from: "2026-10-15", today: "2026-10-15" });
    expect(o2.totals.views).toBe(3);
  });

  it("live: visitatori attivi, pagine ora, feed", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    await t.mutation(api.analytics.record, rec({ vid: "a", path: "/" }));
    await t.mutation(api.analytics.record, rec({ vid: "b", path: "/" }));
    await t.mutation(api.analytics.record, rec({ vid: "b", path: "/contact" }));
    const live = await client.query(api.analytics.live, { since: Date.now() - 60_000 });
    expect(live.activeVisitors).toBe(2);
    expect(live.pagesNow[0]).toEqual({ path: "/", visitors: 2 });
    expect(live.feed).toHaveLength(3);
    expect(live.feed[0].path).toBe("/contact"); // più recente per primo
    expect((await client.query(api.analytics.live, { since: Date.now() + 60_000 })).activeVisitors).toBe(0);
  });

  it("prune elimina eventi grezzi vecchi e conserva i contatori aggregati", async () => {
    const t = makeT();
    await t.mutation(api.analytics.record, rec({ vid: "a" }));
    await t.run(async (ctx) => {
      await ctx.db.insert("events", { t: Date.now() - 5 * 86_400_000, type: "pv", vid: "old", path: "/", device: "mobile" });
    });
    await t.mutation(internal.analytics.prune, {});
    const left = await t.run(async (ctx) => ({ events: await ctx.db.query("events").collect(), counters: await ctx.db.query("counters").collect() }));
    expect(left.events).toHaveLength(1);
    expect(left.counters.length).toBeGreaterThan(0);
  });

  it("conta i visitatori per lingua (una volta per visitatore al giorno)", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    await t.mutation(api.analytics.record, rec({ vid: "a", lang: "ro", path: "/ro" }));
    await t.mutation(api.analytics.record, rec({ vid: "a", lang: "ro", path: "/ro/contact" })); // stesso visitatore
    await t.mutation(api.analytics.record, rec({ vid: "b", lang: "de", path: "/de" }));
    await t.mutation(api.analytics.record, rec({ vid: "c", path: "/" })); // senza lingua
    const o = await client.query(api.analytics.overview, { from: "2026-10-15", today: "2026-10-15" });
    expect(Object.fromEntries(o.langs.map((r) => [r.key, r.n]))).toEqual({ ro: 1, de: 1 });
  });
});
