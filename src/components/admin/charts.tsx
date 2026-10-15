"use client";

import { useEffect, useRef, useState } from "react";

/** Grafici SVG leggeri (nessuna libreria). La larghezza segue il contenitore: testo sempre leggibile. */

export function BarChart({
  data,
  height = 180,
  barLabel = "vizualizări",
  lineLabel = "vizitatori",
}: {
  data: { label: string; bar: number; line?: number }[];
  height?: number;
  barLabel?: string;
  lineLabel?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = height;
  const padL = 30;
  const padB = 22;
  const max = Math.max(1, ...data.map((d) => Math.max(d.bar, d.line ?? 0)));
  const nice = Math.max(1, Math.ceil(max / 4) * 4);
  const bw = (W - padL) / Math.max(1, data.length);
  const y = (v: number) => H - padB - (v / nice) * (H - padB - 8);
  const step = Math.ceil(data.length / Math.max(3, Math.floor(W / 80)));
  const linePts = data.map((d, i) => `${padL + i * bw + bw / 2},${y(d.line ?? 0)}`).join(" ");

  return (
    <div ref={wrap} className="w-full">
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="img" aria-label={`Grafic ${barLabel} și ${lineLabel}`}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={padL} x2={W} y1={y(nice * t)} y2={y(nice * t)} stroke="rgba(37,40,45,0.08)" />
          <text x={padL - 6} y={y(nice * t) + 3} textAnchor="end" fontSize="10" fill="#6f7681">
            {Math.round(nice * t)}
          </text>
        </g>
      ))}
      {data.map((d, i) => (
        <g key={d.label}>
          <rect
            x={padL + i * bw + bw * 0.18}
            y={y(d.bar)}
            width={Math.max(1, bw * 0.64)}
            height={Math.max(0, H - padB - y(d.bar))}
            rx={Math.min(4, bw * 0.2)}
            fill="rgba(220,36,48,0.85)"
          >
            <title>{`${d.label}: ${d.bar} ${barLabel}${d.line !== undefined ? `, ${d.line} ${lineLabel}` : ""}`}</title>
          </rect>
          {i % step === 0 && (
            <text x={padL + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#6f7681">
              {d.label}
            </text>
          )}
        </g>
      ))}
      {data.some((d) => d.line !== undefined) && (
        <polyline points={linePts} fill="none" stroke="#25282d" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.75" />
      )}
    </svg>
    </div>
  );
}

export function RankList({ rows, empty = "Încă nu există date." }: { rows: { key: string; n: number }[]; empty?: string }) {
  if (rows.length === 0) return <p className="text-sm text-ink-mute">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.n));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.key} className="text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate font-medium" title={r.key}>{r.key}</span>
            <span className="tabular-nums text-ink-soft">{r.n}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full bg-red/80" style={{ width: `${(r.n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
