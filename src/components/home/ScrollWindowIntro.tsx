"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Apertura a scorrimento: a tutto schermo una finestra chiusa; scorrendo l'anta si apre (cerniere a sinistra),
 * la vista si avvicina, poi il telaio sfuma sottilmente e compare il sito vero e proprio (l'hero sta già sotto).
 * La geometria segue le dimensioni dello schermo; ogni frame aggiorna pochi attributi SVG (nessuna libreria).
 * Con «riduci movimento» la scena è nascosta via CSS (.scroll-intro).
 */

const HEADER = 68; // altezza dell'header sticky
const PERSPECTIVE = 0.2;

type Geo = { W: number; H: number; fx: number; fy: number; fw: number; fh: number; t: number; ax: number; ay: number; aw: number; ah: number; cx: number; cy: number };

function geometry(W: number, H: number): Geo {
  const m = Math.round(Math.min(W, H) * 0.04);
  const t = Math.round(Math.min(W, H) * 0.045);
  const fx = m;
  const fy = HEADER + Math.round(m * 0.5);
  const fw = W - 2 * m;
  const fh = H - fy - Math.round(m * 1.6);
  const ax = fx + t;
  const ay = fy + t;
  const aw = fw - 2 * t;
  const ah = fh - 2 * t;
  return { W, H, fx, fy, fw, fh, t, ax, ay, aw, ah, cx: ax + aw / 2, cy: ay + ah / 2 };
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (x: number) => x * x * (3 - 2 * x);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Punto (X,Y) del piano dell'anta ruotata di `th` attorno alla cerniera (a sinistra), con prospettiva leggera. */
function proj(g: Geo, X: number, Y: number, th: number): [number, number] {
  const u = (X - g.ax) / g.aw;
  const xRaw = g.ax + u * g.aw * Math.cos(th);
  const s = 1 / (1 - PERSPECTIVE * u * Math.sin(th));
  return [g.cx + (xRaw - g.cx) * s, g.cy + (Y - g.cy) * s];
}
const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
/** Anta come cornice (contorno + apertura del vetro, regola even-odd): il vetro resta trasparente. */
const ringD = (g: Geo, th: number) => {
  const gi = g.t * 0.7;
  const ring = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
  const box = (inset: number): [number, number][] => [
    proj(g, g.ax + inset, g.ay + inset, th),
    proj(g, g.ax + g.aw - inset, g.ay + inset, th),
    proj(g, g.ax + g.aw - inset, g.ay + g.ah - inset, th),
    proj(g, g.ax + inset, g.ay + g.ah - inset, th),
  ];
  return ring(box(0)) + ring(box(gi));
};
const rectPts = (g: Geo, x0: number, y0: number, x1: number, y1: number, th: number) =>
  poly([proj(g, x0, y0, th), proj(g, x1, y0, th), proj(g, x1, y1, th), proj(g, x0, y1, th)]);

export function ScrollWindowIntro() {
  const t = useTranslations("common");
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const zoom = useRef<SVGGElement>(null);
  const frame = useRef<SVGGElement>(null);
  const white = useRef<SVGRectElement>(null);
  const sash = useRef<SVGPathElement>(null);
  const glass = useRef<SVGPolygonElement>(null);
  const handle = useRef<SVGPolygonElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ W: 1440, H: 900 });
  const geo = geometry(dims.W, dims.H);

  // Dimensioni reali dello schermo (la scena è in pixel: linee sottili e proporzioni corrette ovunque)
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
    if (!w || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("intro-pending");

    let raf = 0;
    let done = false;
    const render = () => {
      raf = 0;
      const st = stage.current;
      if (!st) return;
      const g = geometry(dims.W, dims.H);
      const span = Math.max(1, w.offsetHeight - st.offsetHeight);
      const p = clamp(-w.getBoundingClientRect().top / span);

      const th = (easeInOut(clamp(p / 0.55)) * 76 * Math.PI) / 180;
      const Z = 1 + 0.9 * smooth(clamp((p - 0.35) / 0.55));
      const frameOp = 1 - smooth(clamp((p - 0.72) / 0.2));
      const whiteOp = smooth(clamp((p - 0.74) / 0.18));
      const rootOp = 1 - smooth(clamp((p - 0.9) / 0.1));

      zoom.current?.setAttribute("transform", `translate(${g.cx} ${g.cy}) scale(${Z.toFixed(4)}) translate(${-g.cx} ${-g.cy})`);
      frame.current?.setAttribute("opacity", frameOp.toFixed(3));
      white.current?.setAttribute("opacity", whiteOp.toFixed(3));

      sash.current?.setAttribute("d", ringD(g, th));
      const gi = g.t * 0.7;
      glass.current?.setAttribute("points", rectPts(g, g.ax + gi, g.ay + gi, g.ax + g.aw - gi, g.ay + g.ah - gi, th));
      handle.current?.setAttribute("points", rectPts(g, g.ax + g.aw - gi * 0.95, g.cy - 52, g.ax + g.aw - gi * 0.35, g.cy + 52, th));

      st.style.opacity = rootOp.toFixed(3);
      st.style.visibility = rootOp <= 0.001 ? "hidden" : "visible";
      if (cue.current) cue.current.style.opacity = String(clamp(1 - p * 8));

      const nowDone = p > 0.8;
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

  const g = geo;
  const ink = "#1f2328";
  const ne = { vectorEffect: "non-scaling-stroke" } as const;
  const R = Math.min(g.aw, g.ah);
  const sunX = g.ax + g.aw * 0.74;
  const sunY = g.ay + g.ah * 0.3;
  const sky = (fx: number, fy2: number) => [g.ax + g.aw * fx, g.ay + g.ah * fy2] as const;
  const clouds: { x: number; y: number; w: number }[] = [
    { x: 0.1, y: 0.2, w: 0.2 }, { x: 0.45, y: 0.12, w: 0.16 }, { x: 0.62, y: 0.42, w: 0.22 }, { x: 0.22, y: 0.5, w: 0.14 },
  ];
  const skyline = [
    { x: 0.04, w: 0.07, h: 0.32 }, { x: 0.13, w: 0.05, h: 0.22 }, { x: 0.22, w: 0.08, h: 0.28 }, { x: 0.34, w: 0.06, h: 0.18 },
    { x: 0.55, w: 0.07, h: 0.26 }, { x: 0.66, w: 0.09, h: 0.34 }, { x: 0.79, w: 0.05, h: 0.2 }, { x: 0.88, w: 0.07, h: 0.27 },
  ];

  return (
    <div ref={wrap} className="scroll-intro" aria-hidden>
      <noscript>
        <style>{".scroll-intro{display:none!important}"}</style>
      </noscript>
      <div ref={stage} className="scroll-intro__stage">
        <svg viewBox={`0 0 ${g.W} ${g.H}`} className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="si-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b9d0e5" />
              <stop offset="0.55" stopColor="#e3edf6" />
              <stop offset="1" stopColor="#fff2df" />
            </linearGradient>
            <radialGradient id="si-sun" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff1cf" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fff1cf" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="si-glass" gradientUnits="userSpaceOnUse" x1={g.ax} y1={g.ay} x2={g.ax + g.aw} y2={g.ay + g.ah}>
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="0.5" stopColor="#cfe3ee" stopOpacity="0.2" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.42" />
            </linearGradient>
            <clipPath id="si-aperture">
              <rect x={g.ax} y={g.ay} width={g.aw} height={g.ah} />
            </clipPath>
            <pattern id="si-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="rgba(31,35,40,0.045)" />
            </pattern>
          </defs>

          <g ref={zoom}>
            {/* parete */}
            <rect x={-g.W * 2} y={-g.H * 2} width={g.W * 5} height={g.H * 5} fill="url(#si-grid)" />

            {/* paesaggio nel vano */}
            <g clipPath="url(#si-aperture)">
              <rect x={g.ax} y={g.ay} width={g.aw} height={g.ah} fill="url(#si-sky)" />
              <circle cx={sunX} cy={sunY} r={R * 0.3} fill="url(#si-sun)" />
              <circle cx={sunX} cy={sunY} r={R * 0.065} fill="#fff6e0" />
              <g fill={ink} fillOpacity="0.075">
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
                        const [x, y] = sky(c.x, c.y);
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

            {/* telaio, davanzale, anta */}
            <g ref={frame}>
              <rect x={g.fx + 6} y={g.fy + 12} width={g.fw} height={g.fh} rx="8" fill={ink} fillOpacity="0.045" />
              <path d={`M${g.fx} ${g.fy}h${g.fw}v${g.fh}h${-g.fw}ZM${g.ax} ${g.ay}v${g.ah}h${g.aw}v${-g.ah}Z`} fill="#fff" fillRule="evenodd" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" {...ne} />
              <rect x={g.fx + g.t * 0.35} y={g.fy + g.t * 0.35} width={g.fw - g.t * 0.7} height={g.fh - g.t * 0.7} rx="4" fill="none" stroke={ink} strokeOpacity="0.2" {...ne} />
              <rect x={g.ax} y={g.ay} width={g.aw} height={g.ah} fill="none" stroke={ink} strokeOpacity="0.55" strokeWidth="1.2" {...ne} />
              <rect x={g.fx - 16} y={g.fy + g.fh} width={g.fw + 32} height={Math.max(14, g.t * 0.5)} rx="3" fill="#f1f3f5" stroke={ink} strokeOpacity="0.55" {...ne} />
              <path ref={sash} fill="#fff" fillRule="evenodd" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" d={ringD(g, 0)} {...ne} />
              <polygon
                ref={glass}
                fill="url(#si-glass)"
                stroke={ink}
                strokeOpacity="0.5"
                strokeLinejoin="round"
                points={rectPts(g, g.ax + g.t * 0.7, g.ay + g.t * 0.7, g.ax + g.aw - g.t * 0.7, g.ay + g.ah - g.t * 0.7, 0)}
                {...ne}
              />
              <circle cx={g.ax} cy={g.ay + g.ah * 0.16} r="5" fill={ink} />
              <circle cx={g.ax} cy={g.ay + g.ah * 0.84} r="5" fill={ink} />
              <polygon ref={handle} fill="#cc1f2b" points={rectPts(g, g.ax + g.aw - g.t * 0.66, g.cy - 52, g.ax + g.aw - g.t * 0.25, g.cy + 52, 0)} />
            </g>
          </g>
        </svg>

        <div ref={cue} className="absolute inset-x-0 bottom-3 flex justify-center text-ink-mute" aria-hidden>
          <ChevronDown size={26} strokeWidth={1.5} className="animate-bounce" aria-label={t("scrollDown")} />
        </div>
      </div>
    </div>
  );
}
