"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Intro cinematica a scorrimento (home).
 * Stanza in penombra, a tutto schermo una finestra chiusa e luminosa con il titolo in sovrimpressione.
 * Scorrendo: il titolo svanisce, l'anta si apre (cerniere a sinistra, prospettiva), la luce invade la stanza,
 * la camera attraversa la finestra, il telaio sfuma sottilmente e compare il sito (header compreso).
 * Tutto è legato alla posizione di scroll: ogni frame aggiorna pochi attributi (nessuna libreria).
 */

const PERSPECTIVE = 0.22;

type Geo = { W: number; H: number; fx: number; fy: number; fw: number; fh: number; t: number; ax: number; ay: number; aw: number; ah: number; cx: number; cy: number };

function geometry(W: number, H: number): Geo {
  const m = Math.round(Math.min(W, H) * 0.06);
  const t = Math.round(Math.min(W, H) * 0.045);
  const fx = m;
  const fy = m;
  const fw = W - 2 * m;
  const fh = H - Math.round(m * 2.4);
  const ax = fx + t;
  const ay = fy + t;
  const aw = fw - 2 * t;
  const ah = fh - 2 * t;
  return { W, H, fx, fy, fw, fh, t, ax, ay, aw, ah, cx: ax + aw / 2, cy: ay + ah / 2 };
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (x: number) => x * x * (3 - 2 * x);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** progresso 0→1 di `p` nell'intervallo [a, b], con curva morbida */
const seg = (p: number, a: number, b: number) => smooth(clamp((p - a) / (b - a)));

/** Finestra a 2 ante: "L" con cerniere a sinistra, "R" con cerniere a destra; si incontrano al centro del vano. */
type Side = "L" | "R";

/**
 * Punto (X,Y) del piano di un'anta ruotata di `th` attorno alla propria cerniera, con prospettiva.
 * `u` = distanza dalla cerniera (0 alla cerniera, 1 al bordo libero centrale).
 */
function proj(g: Geo, side: Side, X: number, Y: number, th: number): [number, number] {
  const half = g.aw / 2;
  const hinge = side === "L" ? g.ax : g.ax + g.aw;
  const dir = side === "L" ? 1 : -1;
  const u = Math.abs(X - hinge) / half;
  const xRaw = hinge + dir * u * half * Math.cos(th);
  const s = 1 / (1 - PERSPECTIVE * u * Math.sin(th));
  return [g.cx + (xRaw - g.cx) * s, g.cy + (Y - g.cy) * s];
}
const ring = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
const box = (g: Geo, side: Side, x0: number, y0: number, x1: number, y1: number, th: number): [number, number][] => [
  proj(g, side, x0, y0, th),
  proj(g, side, x1, y0, th),
  proj(g, side, x1, y1, th),
  proj(g, side, x0, y1, th),
];
/** Estremi orizzontali di un'anta (dalla cerniera al centro del vano). */
const span = (g: Geo, side: Side): [number, number] => (side === "L" ? [g.ax, g.cx] : [g.cx, g.ax + g.aw]);
/** Anta come cornice (contorno + vano del vetro, even-odd): il vetro resta trasparente. */
const sashD = (g: Geo, side: Side, th: number) => {
  const gi = g.t * 0.62;
  const [x0, x1] = span(g, side);
  return ring(box(g, side, x0, g.ay, x1, g.ay + g.ah, th)) + ring(box(g, side, x0 + gi, g.ay + gi, x1 - gi, g.ay + g.ah - gi, th));
};
const glassD = (g: Geo, side: Side, th: number) => {
  const gi = g.t * 0.62;
  const [x0, x1] = span(g, side);
  return ring(box(g, side, x0 + gi, g.ay + gi, x1 - gi, g.ay + g.ah - gi, th));
};
/** Maniglia rossa sul bordo centrale dell'anta destra (anta principale). */
const handleD = (g: Geo, th: number) => {
  const gi = g.t * 0.62;
  return ring(box(g, "R", g.cx + gi * 0.3, g.cy - 56, g.cx + gi * 0.85, g.cy + 56, th));
};

export function ScrollWindowIntro() {
  const t = useTranslations("common");
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const zoom = useRef<SVGGElement>(null);
  const frame = useRef<SVGGElement>(null);
  const dark = useRef<SVGPathElement>(null);
  const bloom = useRef<SVGRectElement>(null);
  const white = useRef<SVGRectElement>(null);
  const sashL = useRef<SVGPathElement>(null);
  const sashR = useRef<SVGPathElement>(null);
  const glassL = useRef<SVGPathElement>(null);
  const glassR = useRef<SVGPathElement>(null);
  const handle = useRef<SVGPathElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ W: 1440, H: 900 });

  // La scena è in pixel reali dello schermo: linee sottili e proporzioni corrette su ogni dispositivo.
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const measure = () => {
      const W = Math.round(st.clientWidth);
      const H = Math.round(st.clientHeight);
      if (W > 0 && H > 0) setDims((d) => (d.W === W && d.H === H ? d : { W, H }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const w = wrap.current;
    if (!w) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) svg.current?.pauseAnimations?.(); // nuvole ferme; la scena resta guidata dallo scroll
    const g = geometry(dims.W, dims.H);
    root.classList.add("intro-pending");

    let raf = 0;
    let done = false;
    const render = () => {
      raf = 0;
      const st = stage.current;
      if (!st) return;
      const span = Math.max(1, w.offsetHeight - st.offsetHeight);
      const p = clamp(-w.getBoundingClientRect().top / span);

      const titleOut = seg(p, 0.04, 0.18);
      // l'anta destra (con la maniglia) parte per prima, la sinistra la segue: apertura "a battente" più naturale
      const MAX = (82 * Math.PI) / 180;
      const thR = easeInOut(clamp((p - 0.08) / 0.44)) * MAX;
      const thL = easeInOut(clamp((p - 0.13) / 0.44)) * MAX;
      const Z = 1 + 1.5 * seg(p, 0.46, 0.94);
      const light = seg(p, 0.36, 0.86);
      const frameOp = 1 - seg(p, 0.72, 0.9);
      const whiteOp = seg(p, 0.76, 0.94);
      const stageOp = 1 - seg(p, 0.92, 1);

      zoom.current?.setAttribute("transform", `translate(${g.cx} ${g.cy}) scale(${Z.toFixed(4)}) translate(${-g.cx} ${-g.cy})`);
      dark.current?.setAttribute("opacity", (1 - light).toFixed(3));
      bloom.current?.setAttribute("opacity", (0.25 + 0.75 * seg(p, 0.12, 0.6)).toFixed(3));
      frame.current?.setAttribute("opacity", frameOp.toFixed(3));
      white.current?.setAttribute("opacity", whiteOp.toFixed(3));
      sashL.current?.setAttribute("d", sashD(g, "L", thL));
      sashR.current?.setAttribute("d", sashD(g, "R", thR));
      glassL.current?.setAttribute("d", glassD(g, "L", thL));
      glassR.current?.setAttribute("d", glassD(g, "R", thR));
      handle.current?.setAttribute("d", handleD(g, thR));

      if (title.current) {
        title.current.style.opacity = (1 - titleOut).toFixed(3);
        title.current.style.transform = `translate3d(0, ${(-40 * titleOut).toFixed(1)}px, 0)`;
      }
      st.style.opacity = stageOp.toFixed(3);
      st.style.visibility = stageOp <= 0.001 ? "hidden" : "visible";

      const nowDone = p > 0.9;
      if (nowDone !== done) {
        done = nowDone;
        root.classList.toggle("intro-pending", !done);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
      root.classList.remove("intro-pending");
    };
  }, [dims]);

  const g = geometry(dims.W, dims.H);
  const ink = "#1f2328";
  const ne = { vectorEffect: "non-scaling-stroke" } as const;
  const R = Math.min(g.aw, g.ah);
  const sunX = g.ax + g.aw * 0.74;
  const sunY = g.ay + g.ah * 0.3;
  const clouds = [
    { x: 0.08, y: 0.18, w: 0.2 }, { x: 0.44, y: 0.1, w: 0.16 }, { x: 0.6, y: 0.4, w: 0.22 }, { x: 0.2, y: 0.48, w: 0.14 },
  ];
  const skyline = [
    { x: 0.03, w: 0.07, h: 0.3 }, { x: 0.12, w: 0.05, h: 0.2 }, { x: 0.2, w: 0.08, h: 0.26 }, { x: 0.32, w: 0.06, h: 0.17 },
    { x: 0.55, w: 0.07, h: 0.24 }, { x: 0.65, w: 0.09, h: 0.32 }, { x: 0.78, w: 0.05, h: 0.19 }, { x: 0.87, w: 0.08, h: 0.26 },
  ];
  const big = { x: -g.W * 3, y: -g.H * 3, w: g.W * 7, h: g.H * 7 };

  return (
    <div ref={wrap} className="scroll-intro" aria-hidden>
      <noscript>
        <style>{".scroll-intro{display:none!important}"}</style>
      </noscript>
      <div ref={stage} className="scroll-intro__stage">
        <svg ref={svg} viewBox={`0 0 ${g.W} ${g.H}`} className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="si-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a9c4dd" />
              <stop offset="0.55" stopColor="#dde9f4" />
              <stop offset="1" stopColor="#fff0da" />
            </linearGradient>
            <radialGradient id="si-sun" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff1cf" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fff1cf" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="si-room" cx="0.5" cy="0.45" r="0.75">
              <stop offset="0" stopColor="#2a2e35" />
              <stop offset="1" stopColor="#0e1013" />
            </radialGradient>
            <radialGradient id="si-bloom" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff8ea" stopOpacity="0.55" />
              <stop offset="0.6" stopColor="#fff8ea" stopOpacity="0.18" />
              <stop offset="1" stopColor="#fff8ea" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="si-glass" gradientUnits="userSpaceOnUse" x1={g.ax} y1={g.ay} x2={g.ax + g.aw} y2={g.ay + g.ah}>
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.42" />
              <stop offset="0.5" stopColor="#cfe3ee" stopOpacity="0.12" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.34" />
            </linearGradient>
            <clipPath id="si-aperture">
              <rect x={g.ax} y={g.ay} width={g.aw} height={g.ah} />
            </clipPath>
          </defs>

          <g ref={zoom}>
            {/* stanza: chiara sotto, penombra sopra (si dissolve quando entra la luce) */}
            <rect x={big.x} y={big.y} width={big.w} height={big.h} fill="#ffffff" />
            <path
              ref={dark}
              d={`M${big.x} ${big.y}h${big.w}v${big.h}h${-big.w}ZM${g.ax} ${g.ay}v${g.ah}h${g.aw}v${-g.ah}Z`}
              fill="url(#si-room)"
              fillRule="evenodd"
            />

            {/* esterno */}
            <g clipPath="url(#si-aperture)">
              <rect x={g.ax} y={g.ay} width={g.aw} height={g.ah} fill="url(#si-sky)" />
              <circle cx={sunX} cy={sunY} r={R * 0.32} fill="url(#si-sun)" />
              <circle cx={sunX} cy={sunY} r={R * 0.065} fill="#fff6e0" />
              <g fill={ink} fillOpacity="0.08">
                {skyline.map((b) => (
                  <rect key={b.x} x={g.ax + g.aw * b.x} y={g.ay + g.ah * (1 - b.h)} width={g.aw * b.w} height={g.ah * b.h} rx={3} />
                ))}
              </g>
              <g fill="#fff" fillOpacity="0.92">
                <g>
                  <animateTransform attributeName="transform" type="translate" values={`0 0;${-g.aw} 0`} dur="60s" repeatCount="indefinite" />
                  {[0, g.aw].map((o) => (
                    <g key={o} transform={`translate(${o} 0)`}>
                      {clouds.map((c) => {
                        const x = g.ax + g.aw * c.x;
                        const y = g.ay + g.ah * c.y;
                        const cw = g.aw * c.w;
                        return (
                          <g key={c.x}>
                            <rect x={x} y={y} width={cw} height={R * 0.028} rx={R * 0.014} />
                            <rect x={x + cw * 0.18} y={y + R * 0.034} width={cw * 0.62} height={R * 0.022} rx={R * 0.011} />
                          </g>
                        );
                      })}
                    </g>
                  ))}
                </g>
              </g>
              <rect ref={white} x={g.ax} y={g.ay} width={g.aw} height={g.ah} fill="#fff" opacity="0" />
            </g>

            {/* luce che entra: alone morbido attorno al vano */}
            <rect
              ref={bloom}
              x={g.ax - g.aw * 0.35}
              y={g.ay - g.ah * 0.35}
              width={g.aw * 1.7}
              height={g.ah * 1.7}
              fill="url(#si-bloom)"
              opacity="0.25"
              style={{ mixBlendMode: "screen" }}
            />

            {/* telaio, davanzale, anta */}
            <g ref={frame}>
              <path
                d={`M${g.fx} ${g.fy}h${g.fw}v${g.fh}h${-g.fw}ZM${g.ax} ${g.ay}v${g.ah}h${g.aw}v${-g.ah}Z`}
                fill="#f7f8fa"
                fillRule="evenodd"
                stroke={ink}
                strokeWidth="1.4"
                strokeLinejoin="round"
                {...ne}
              />
              <rect x={g.fx + g.t * 0.35} y={g.fy + g.t * 0.35} width={g.fw - g.t * 0.7} height={g.fh - g.t * 0.7} fill="none" stroke={ink} strokeOpacity="0.18" {...ne} />
              <rect x={g.ax} y={g.ay} width={g.aw} height={g.ah} fill="none" stroke={ink} strokeOpacity="0.5" strokeWidth="1.2" {...ne} />
              <rect x={g.fx - 18} y={g.fy + g.fh} width={g.fw + 36} height={Math.max(14, g.t * 0.5)} rx="3" fill="#eef0f3" stroke={ink} strokeOpacity="0.5" {...ne} />
              {(["L", "R"] as const).map((side) => (
                <g key={side}>
                  <path ref={side === "L" ? sashL : sashR} d={sashD(g, side, 0)} fill="#ffffff" fillRule="evenodd" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" {...ne} />
                  <path ref={side === "L" ? glassL : glassR} d={glassD(g, side, 0)} fill="url(#si-glass)" stroke={ink} strokeOpacity="0.45" strokeLinejoin="round" {...ne} />
                </g>
              ))}
              {/* cerniere: due per anta, sui lati esterni */}
              {[g.ax, g.ax + g.aw].flatMap((x) => [0.16, 0.84].map((f) => <circle key={`${x}-${f}`} cx={x} cy={g.ay + g.ah * f} r="5" fill={ink} />))}
              <path ref={handle} d={handleD(g, 0)} fill="#cc1f2b" />
            </g>
          </g>
        </svg>

        {/* titolo in sovrimpressione (decorativo: il titolo vero è nell'hero) */}
        <div ref={title} className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <p className="eyebrow">Winex</p>
          <p className="mt-5 max-w-3xl font-display text-[clamp(1.7rem,5.2vw,4.4rem)] font-bold leading-[1.04] tracking-[-0.03em] text-ink">
            {t("tagline")}
          </p>
          <span className="mt-10 grid h-11 w-11 place-items-center rounded-full border border-[var(--line-strong)] bg-white/70 text-ink">
            <ChevronDown size={20} strokeWidth={1.6} className="animate-bounce" />
          </span>
        </div>
      </div>
    </div>
  );
}
