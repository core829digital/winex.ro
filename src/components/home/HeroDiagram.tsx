"use client";

import { useEffect, useRef } from "react";

type Props = {
  label: string;
  interior: string;
  exterior: string;
  items: { title: string; text: string }[];
};

/**
 * Sezione schematica (in pianta) di un serramento: telaio multicamera, vetrocamera, guarnizioni.
 * Si "traccia" in sequenza all'ingresso (CSS puro). Il flusso termico animato gira solo su desktop
 * e va in pausa quando la figura non è visibile.
 */
export function HeroDiagram({ label, interior, exterior, items }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      el.dataset.paused = e.isIntersecting ? "false" : "true";
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const ink = "#1f2328";
  const chamberXs = [70, 114, 158, 313, 357, 401];

  return (
    <div ref={root} className="surface overflow-hidden shadow-[var(--shadow-md)]">
      <div className="relative">
        <svg viewBox="0 0 520 380" className="block h-auto w-full" role="img" aria-label={label}>
          <defs>
            <linearGradient id="hd-warm" x1="0" x2="1">
              <stop offset="0" stopColor="#cc1f2b" stopOpacity="0.09" />
              <stop offset="1" stopColor="#cc1f2b" stopOpacity="0.015" />
            </linearGradient>
            <linearGradient id="hd-cool" x1="0" x2="1">
              <stop offset="0" stopColor="#8794a6" stopOpacity="0.02" />
              <stop offset="1" stopColor="#8794a6" stopOpacity="0.14" />
            </linearGradient>
            <linearGradient id="hd-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.7" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </linearGradient>
            <mask id="hd-glass-mask">
              <rect x="200" y="120" width="120" height="260" fill="url(#hd-fade)" />
            </mask>
            <pattern id="hd-grid" width="26" height="26" patternUnits="userSpaceOnUse">
              <path d="M26 0H0V26" fill="none" stroke="rgba(31,35,40,0.05)" />
            </pattern>
          </defs>

          {/* zone termiche */}
          <rect width="260" height="380" fill="url(#hd-warm)" />
          <rect x="260" width="260" height="380" fill="url(#hd-cool)" />
          <rect width="520" height="380" fill="url(#hd-grid)" />
          <line x1="260" y1="170" x2="260" y2="380" stroke="rgba(31,35,40,0.18)" strokeDasharray="3 5" />

          {/* telaio con battuta per il vetro */}
          <path
            className="draw-fill"
            style={{ "--d": "200ms" } as React.CSSProperties}
            pathLength={1}
            d="M60 50H460V160H305V122H215V160H60Z"
            fill="#fff"
            stroke={ink}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {/* camere del profilo */}
          {chamberXs.map((x, i) => (
            <rect
              key={x}
              className="draw-fill"
              style={{ "--d": `${650 + i * 90}ms` } as React.CSSProperties}
              pathLength={1}
              x={x}
              y={62}
              width={38}
              height={86}
              rx={4}
              fill="#f1f3f5"
              stroke={ink}
              strokeOpacity="0.55"
              strokeWidth="1"
            />
          ))}
          <rect
            className="draw-fill"
            style={{ "--d": "1100ms" } as React.CSSProperties}
            pathLength={1}
            x={221}
            y={62}
            width={78}
            height={52}
            rx={4}
            fill="#f1f3f5"
            stroke={ink}
            strokeOpacity="0.55"
            strokeWidth="1"
          />

          {/* vetrocamera: due lastre + distanziale */}
          <g mask="url(#hd-glass-mask)">
            <rect className="draw-fill" style={{ "--d": "1250ms" } as React.CSSProperties} pathLength={1} x="235" y="126" width="5" height="254" fill="#cfe3ee" stroke={ink} strokeWidth="1.1" />
            <rect className="draw-fill" style={{ "--d": "1350ms" } as React.CSSProperties} pathLength={1} x="285" y="126" width="5" height="254" fill="#cfe3ee" stroke={ink} strokeWidth="1.1" />
            <rect x="240" y="126" width="45" height="254" fill="#fff" fillOpacity="0.55" className="fade-in" style={{ "--d": "1500ms" } as React.CSSProperties} />
          </g>
          <rect className="pop" style={{ "--d": "1500ms" } as React.CSSProperties} x="235" y="126" width="55" height="20" rx="2" fill={ink} fillOpacity="0.82" />

          {/* guarnizioni */}
          <rect className="pop" style={{ "--d": "1650ms" } as React.CSSProperties} x="219" y="128" width="14" height="26" rx="5" fill={ink} />
          <rect className="pop" style={{ "--d": "1700ms" } as React.CSSProperties} x="292" y="128" width="14" height="26" rx="5" fill={ink} />

          {/* flusso termico: il calore resta all'interno */}
          <g className="fade-in" style={{ "--d": "1900ms" } as React.CSSProperties}>
            <path className="flow" d="M28 332C118 332 214 322 230 282" fill="none" stroke="#cc1f2b" strokeWidth="1.8" strokeLinecap="round" />
            <path className="flow" d="M230 282C214 238 140 244 36 236" fill="none" stroke="#cc1f2b" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M44 236l-9 0.4 6.5 5.6" fill="none" stroke="#cc1f2b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -3)" />
            <path className="flow" d="M28 300C100 300 196 292 228 262" fill="none" stroke="#cc1f2b" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
          </g>

          {/* riferimenti numerati */}
          {[
            { n: 1, cx: 112, cy: 208, x2: 114, y2: 150 },
            { n: 2, cx: 362, cy: 262, x2: 292, y2: 262 },
            { n: 3, cx: 352, cy: 198, x2: 308, y2: 150 },
          ].map((m, i) => (
            <g key={m.n}>
              <line className="draw" style={{ "--d": `${2000 + i * 120}ms` } as React.CSSProperties} pathLength={1} x1={m.cx} y1={m.cy} x2={m.x2} y2={m.y2} stroke={ink} strokeWidth="1" />
              <circle className="pop" style={{ "--d": `${2150 + i * 120}ms` } as React.CSSProperties} cx={m.cx} cy={m.cy} r="11" fill="#cc1f2b" />
              <text className="fade-in" style={{ "--d": `${2250 + i * 120}ms` } as React.CSSProperties} x={m.cx} y={m.cy + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="Manrope Variable, sans-serif">
                {m.n}
              </text>
            </g>
          ))}
        </svg>

        <span className="pointer-events-none absolute bottom-3 left-4 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-red-deep">{interior}</span>
        <span className="pointer-events-none absolute bottom-3 right-4 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink-mute">{exterior}</span>
      </div>

      <ol className="divide-y divide-line border-t border-line">
        {items.map((it, i) => (
          <li key={it.title} className="fade-in flex gap-4 px-5 py-4" style={{ "--d": `${2300 + i * 140}ms` } as React.CSSProperties}>
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red text-xs font-bold text-white">{i + 1}</span>
            <div>
              <p className="font-display text-sm font-bold">{it.title}</p>
              <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-soft">{it.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
