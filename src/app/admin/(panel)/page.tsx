"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { MousePointerClick, Eye } from "lucide-react";
import { api } from "@convex/_generated/api";
import { Card, PageHeader, Skeleton, Stat, timeAgo, Btn } from "@/components/admin/ui";
import { BarChart, RankList } from "@/components/admin/charts";
import { daysBack } from "@/lib/dates";

const RANGES = [7, 30, 90] as const;
const COUNTRY = new Intl.DisplayNames(["ro"], { type: "region" });
const countryName = (k: string) => {
  try {
    return COUNTRY.of(k) ?? k;
  } catch {
    return k;
  }
};
const DEVICE: Record<string, string> = { mobile: "Telefon", desktop: "Calculator", tablet: "Tabletă" };

function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export default function DashboardPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const tick = useNow(10_000);
  const since = useMemo(() => Math.floor((tick - 5 * 60_000) / 10_000) * 10_000, [tick]);
  const days = daysBack(range, new Date(tick)); // stringhe: gli argomenti delle query restano stabili
  const today = days[days.length - 1];

  const live = useQuery(api.analytics.live, { since });
  const ov = useQuery(api.analytics.overview, { from: days[0], today });
  const leads = useQuery(api.leads.newCount);
  const subs = useQuery(api.subscribers.activeCount);

  const chart = days.map((d) => ({
    label: d.slice(5).replace("-", "/"),
    bar: ov?.daily.views[d] ?? 0,
    line: ov?.daily.visitors[d] ?? 0,
  }));
  const hours = Array.from({ length: 24 }, (_, h) => {
    const k = String(h).padStart(2, "0");
    return { label: k, bar: ov?.hourly[k] ?? 0 };
  });

  return (
    <>
      <PageHeader
        title="Panou"
        subtitle="Statistici în timp real ale site-ului winex.ro (fără cookie-uri, date anonime)."
        actions={
          <div className="inline-flex rounded-xl bg-black/[0.05] p-1">
            {RANGES.map((r) => (
              <Btn key={r} size="sm" variant={range === r ? "primary" : "ghost"} onClick={() => setRange(r)}>
                {r} zile
              </Btn>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="col-span-2 rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_1px_2px_rgba(37,40,45,0.04)] lg:col-span-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-mute">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Activi acum
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold tabular-nums">{live ? live.activeVisitors : "–"}</p>
          <p className="mt-1 text-xs text-ink-mute">ultimele 5 minute</p>
        </div>
        <Stat label="Vizualizări azi" value={ov ? ov.totals.viewsToday : "–"} />
        <Stat label="Vizitatori azi" value={ov ? ov.totals.visitorsToday : "–"} />
        <Stat label="Mesaje noi" value={leads ? leads.count : "–"} accent={!!leads && leads.count > 0} />
        <Stat label="Abonați activi" value={subs ?? "–"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title={`Ultimele ${range} zile`} className="lg:col-span-2" action={
          <span className="flex items-center gap-3 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-red/85" />vizualizări</span>
            <span className="flex items-center gap-1.5"><i className="h-0.5 w-3 bg-ink/75" />vizitatori</span>
          </span>
        }>
          {ov ? <BarChart data={chart} /> : <Skeleton className="h-44" />}
          {ov && (
            <p className="mt-3 text-xs text-ink-mute">
              Total perioadă: <b className="text-ink">{ov.totals.views}</b> vizualizări · <b className="text-ink">{ov.totals.visitors}</b> vizite unice-zilnice · <b className="text-ink">{ov.totals.clicks}</b> click-uri
            </p>
          )}
        </Card>

        <Card title="În acest moment">
          {!live ? (
            <Skeleton className="h-40" />
          ) : live.pagesNow.length === 0 ? (
            <p className="text-sm text-ink-mute">Niciun vizitator activ în ultimele 5 minute.</p>
          ) : (
            <ul className="space-y-2">
              {live.pagesNow.map((p) => (
                <li key={p.path} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{p.path}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{p.visitors}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Astăzi, pe ore" className="md:col-span-2 lg:col-span-1">
          {ov ? <BarChart data={hours} height={150} /> : <Skeleton className="h-36" />}
        </Card>
        <Card title="Pagini populare">{ov ? <RankList rows={ov.topPages} /> : <Skeleton className="h-36" />}</Card>
        <Card title="Click-uri populare">{ov ? <RankList rows={ov.clicks} empty="Încă niciun click înregistrat." /> : <Skeleton className="h-36" />}</Card>
        <Card title="Surse de trafic">{ov ? <RankList rows={ov.refs.map((r) => ({ ...r, key: r.key === "direct" ? "Direct" : r.key }))} /> : <Skeleton className="h-36" />}</Card>
        <Card title="Dispozitive">{ov ? <RankList rows={ov.devices.map((r) => ({ ...r, key: DEVICE[r.key] ?? r.key }))} /> : <Skeleton className="h-36" />}</Card>
        <Card title="Țări">{ov ? <RankList rows={ov.countries.map((r) => ({ ...r, key: countryName(r.key) }))} empty="Țara apare când site-ul rulează pe Vercel/Cloudflare." /> : <Skeleton className="h-36" />}</Card>
      </div>

      <Card title="Activitate live" className="mt-4">
        {!live ? (
          <Skeleton className="h-32" />
        ) : live.feed.length === 0 ? (
          <p className="text-sm text-ink-mute">Nicio activitate în ultimele 5 minute. Deschide site-ul într-o altă filă ca să vezi evenimentele apărând aici.</p>
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {live.feed.map((e, i) => (
              <li key={`${e.t}-${i}`} className="flex items-center gap-3 py-2.5 text-sm">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${e.type === "click" ? "bg-red-soft text-red-deep" : "bg-black/[0.05] text-ink-soft"}`}>
                  {e.type === "click" ? <MousePointerClick size={16} /> : <Eye size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{e.type === "click" ? e.label : e.path}</span>
                  <span className="block truncate text-xs text-ink-mute">
                    {e.type === "click" ? e.path : e.ref ? `de la ${e.ref}` : "acces direct"} · {DEVICE[e.device] ?? e.device}
                    {e.country ? ` · ${countryName(e.country)}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-ink-mute">{timeAgo(e.t, tick)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
