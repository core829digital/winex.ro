"use client";

import { useEffect, useRef } from "react";

/**
 * Finestra animata in loop (SMIL, nessuna libreria): si disegna all'ingresso, poi l'anta si apre e si richiude.
 * Chiusa: l'energia (rosso) circola e resta dentro. Aperta: il calore (grigio) esce.
 * Ciclo di 9 s. Pausa quando la figura non è visibile; con "riduci movimento" resta ferma a finestra chiusa.
 */

const DUR = "9s";
const KT = "0;0.12;0.38;0.62;0.88;1";
const EASE = "0 0 1 1;0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1";
const cycle = (closed: string, open: string) => [closed, closed, open, open, closed, closed].join(";");
const loop = { dur: DUR, repeatCount: "indefinite", keyTimes: KT, calcMode: "spline", keySplines: EASE } as const;

export function HeroWindow({ label }: { label: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || typeof svg.pauseAnimations !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      svg.pauseAnimations();
      svg.setCurrentTime(0);
      return;
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations()));
    io.observe(svg);
    return () => io.disconnect();
  }, []);

  const ink = "#1f2328";
  const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

  return (
    <svg ref={ref} viewBox="0 0 520 440" className="block h-auto w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id="hw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9e6f1" />
          <stop offset="1" stopColor="#f7f9fb" />
        </linearGradient>
        <radialGradient id="hw-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3d6" />
          <stop offset="1" stopColor="#fff3d6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hw-glass" gradientUnits="userSpaceOnUse" x1="128" y1="88" x2="392" y2="352">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
          <stop offset="0.45" stopColor="#cfe3ee" stopOpacity="0.38" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
        </linearGradient>
        <clipPath id="hw-aperture">
          <rect x="112" y="72" width="296" height="296" />
        </clipPath>
        <pattern id="hw-grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M26 0H0V26" fill="none" stroke="rgba(31,35,40,0.05)" />
        </pattern>
      </defs>

      <rect width="520" height="440" fill="url(#hw-grid)" />

      {/* telaio fisso: si traccia all'ingresso */}
      <rect className="draw-fill" style={d(150)} pathLength={1} x="90" y="50" width="340" height="340" rx="6" fill="#fff" stroke={ink} strokeWidth="1.6" />
      <rect className="fade-in" style={d(700)} x="98" y="58" width="324" height="324" rx="3" fill="none" stroke={ink} strokeOpacity="0.22" />

      {/* paesaggio dietro il vetro */}
      <g className="fade-in" style={d(500)}>
        <g clipPath="url(#hw-aperture)">
          <rect x="112" y="72" width="296" height="296" fill="url(#hw-sky)" />
          <circle cx="332" cy="150" r="70" fill="url(#hw-sun)" />
          <circle cx="332" cy="150" r="22" fill="#fff6e0" />
          <g fill={ink} fillOpacity="0.07">
            <rect x="130" y="290" width="46" height="90" rx="2" />
            <rect x="182" y="312" width="38" height="70" rx="2" />
            <rect x="262" y="300" width="54" height="80" rx="2" />
            <rect x="330" y="322" width="40" height="60" rx="2" />
          </g>
          <g fill="#fff" fillOpacity="0.9">
            <g>
              <animateTransform attributeName="transform" type="translate" values="0 0;-296 0" dur="44s" repeatCount="indefinite" />
              {[0, 296].map((o) => (
                <g key={o} transform={`translate(${o} 0)`}>
                  <rect x="150" y="104" width="66" height="9" rx="4.5" />
                  <rect x="170" y="116" width="40" height="7" rx="3.5" />
                  <rect x="262" y="180" width="82" height="9" rx="4.5" />
                  <rect x="282" y="192" width="46" height="7" rx="3.5" />
                </g>
              ))}
            </g>
          </g>
        </g>
        <rect x="112" y="72" width="296" height="296" fill="none" stroke={ink} strokeOpacity="0.5" strokeWidth="1.2" />
      </g>

      {/* davanzale */}
      <rect className="fade-in" style={d(800)} x="78" y="390" width="364" height="12" rx="2" fill="#f1f3f5" stroke={ink} strokeOpacity="0.55" />

      {/* anta: si apre e si richiude (cerniere a sinistra) */}
      <g className="fade-in" style={d(900)}>
        <polygon fill="#fff" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" points="112,72 408,72 408,368 112,368">
          <animate attributeName="points" {...loop} values={cycle("112,72 408,72 408,368 112,368", "112,72 232,38 232,402 112,368")} />
        </polygon>
        <polygon fill="url(#hw-glass)" stroke={ink} strokeOpacity="0.5" strokeWidth="1" strokeLinejoin="round" points="128,88 392,88 392,352 128,352">
          <animate attributeName="points" {...loop} values={cycle("128,88 392,88 392,352 128,352", "128,88 220,64 220,376 128,352")} />
        </polygon>
        <circle cx="112" cy="116" r="4" fill={ink} />
        <circle cx="112" cy="324" r="4" fill={ink} />
        <rect rx="3" fill="#cc1f2b" x="380" y="206" width="8" height="44">
          <animate attributeName="x" {...loop} values={cycle("380", "222")} />
          <animate attributeName="y" {...loop} values={cycle("206", "194")} />
          <animate attributeName="height" {...loop} values={cycle("44", "60")} />
        </rect>
      </g>

      {/* energia che resta dentro (finestra chiusa) */}
      <g className="fade-in" style={d(1500)}>
        <rect x="140" y="100" width="240" height="240" rx="4" fill="none" stroke="#cc1f2b" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="5 8">
          <animate attributeName="stroke-dashoffset" values="0;-26" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" {...loop} values={cycle("1", "0")} />
        </rect>
        <rect x="156" y="116" width="208" height="208" rx="3" fill="none" stroke="#cc1f2b" strokeOpacity="0.5" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="4 8">
          <animate attributeName="stroke-dashoffset" values="0;26" dur="2.1s" repeatCount="indefinite" />
          <animate attributeName="opacity" {...loop} values={cycle("1", "0")} />
        </rect>
      </g>

      {/* calore che esce (finestra aperta) */}
      <g stroke="#8794a6" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="4 8" fill="none">
        {[150, 230, 310].map((y, i) => (
          <path key={y} d={`M250 ${y}H468`}>
            <animate attributeName="stroke-dashoffset" values="0;-24" dur={`${1.4 + i * 0.25}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" {...loop} values={cycle("0", "0.85")} />
          </path>
        ))}
      </g>
    </svg>
  );
}
