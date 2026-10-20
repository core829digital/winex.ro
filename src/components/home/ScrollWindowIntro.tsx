"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Apertura a scorrimento: a tutto schermo una finestra chiusa; scorrendo l'anta si apre, la vista si avvicina,
 * poi il telaio sfuma sottilmente e compare il sito vero e proprio (l'hero sta già sotto).
 * Tutto è guidato dalla posizione di scroll (nessuna libreria): ogni frame aggiorna pochi attributi SVG.
 * Con «riduci movimento» la scena è nascosta via CSS (.scroll-intro).
 */

const SKY = { x: 304, y: 164, w: 392, h: 672 }; // apertura (vano) in coordinate viewBox
const HINGE_X = SKY.x;
const CX = 500;
const CY = 500;
const DEPTH = 0.00045;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Punto (X,Y) del piano dell'anta ruotata di `th` radianti attorno alla cerniera, con prospettiva leggera. */
function proj(X: number, Y: number, th: number): [number, number] {
  const u = (X - HINGE_X) / SKY.w;
  const xRaw = HINGE_X + u * SKY.w * Math.cos(th);
  const z = u * SKY.w * Math.sin(th);
  const s = 1 / (1 - DEPTH * z);
  return [CX + (xRaw - CX) * s, CY + (Y - CY) * s];
}
const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

export function ScrollWindowIntro() {
  const t = useTranslations("common");
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const zoom = useRef<SVGGElement>(null);
  const frame = useRef<SVGGElement>(null);
  const white = useRef<SVGRectElement>(null);
  const sash = useRef<SVGPolygonElement>(null);
  const glass = useRef<SVGPolygonElement>(null);
  const handle = useRef<SVGPolygonElement>(null);
  const cue = useRef<HTMLDivElement>(null);

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
      const span = Math.max(1, w.offsetHeight - st.offsetHeight);
      const p = clamp(-w.getBoundingClientRect().top / span);

      const th = easeInOut(clamp(p / 0.55)) * (78 * Math.PI) / 180;
      const Z = 1 + 3.8 * smooth(clamp((p - 0.3) / 0.6));
      const frameOp = 1 - smooth(clamp((p - 0.72) / 0.2));
      const whiteOp = smooth(clamp((p - 0.7) / 0.22));
      const rootOp = 1 - smooth(clamp((p - 0.9) / 0.1));

      zoom.current?.setAttribute("transform", `translate(${CX} ${CY}) scale(${Z.toFixed(4)}) translate(${-CX} ${-CY})`);
      frame.current?.setAttribute("opacity", frameOp.toFixed(3));
      white.current?.setAttribute("opacity", whiteOp.toFixed(3));

      const { x, y, w: sw, h } = SKY;
      sash.current?.setAttribute("points", poly([proj(x, y, th), proj(x + sw, y, th), proj(x + sw, y + h, th), proj(x, y + h, th)]));
      const g = 26;
      glass.current?.setAttribute(
        "points",
        poly([proj(x + g, y + g, th), proj(x + sw - g, y + g, th), proj(x + sw - g, y + h - g, th), proj(x + g, y + h - g, th)]),
      );
      handle.current?.setAttribute(
        "points",
        poly([proj(x + sw - 20, 450, th), proj(x + sw - 8, 450, th), proj(x + sw - 8, 560, th), proj(x + sw - 20, 560, th)]),
      );

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
  }, []);

  const ink = "#1f2328";
  const ne = { vectorEffect: "non-scaling-stroke" } as const;

  return (
    <div ref={wrap} className="scroll-intro" aria-hidden>
      <noscript>
        <style>{".scroll-intro{display:none!important}"}</style>
      </noscript>
      <div ref={stage} className="scroll-intro__stage">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="si-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d3e2ef" />
              <stop offset="1" stopColor="#f8fafc" />
            </linearGradient>
            <radialGradient id="si-sun" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff3d6" />
              <stop offset="1" stopColor="#fff3d6" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="si-glass" gradientUnits="userSpaceOnUse" x1="330" y1="190" x2="670" y2="810">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="0.5" stopColor="#cfe3ee" stopOpacity="0.34" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.5" />
            </linearGradient>
            <clipPath id="si-aperture">
              <rect x={SKY.x} y={SKY.y} width={SKY.w} height={SKY.h} />
            </clipPath>
            <pattern id="si-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="rgba(31,35,40,0.045)" />
            </pattern>
          </defs>

          <g ref={zoom}>
            {/* parete */}
            <rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#si-grid)" />

            {/* paesaggio nel vano */}
            <g clipPath="url(#si-aperture)">
              <rect x={SKY.x} y={SKY.y} width={SKY.w} height={SKY.h} fill="url(#si-sky)" />
              <circle cx="610" cy="330" r="150" fill="url(#si-sun)" />
              <circle cx="610" cy="330" r="42" fill="#fff6e0" />
              <g fill={ink} fillOpacity="0.07">
                <rect x="320" y="650" width="90" height="190" rx="3" />
                <rect x="420" y="700" width="70" height="140" rx="3" />
                <rect x="540" y="670" width="100" height="170" rx="3" />
                <rect x="650" y="730" width="60" height="110" rx="3" />
              </g>
              <g fill="#fff" fillOpacity="0.92">
                <g>
                  <animateTransform attributeName="transform" type="translate" values="0 0;-392 0" dur="48s" repeatCount="indefinite" />
                  {[0, 392].map((o) => (
                    <g key={o} transform={`translate(${o} 0)`}>
                      <rect x="330" y="240" width="110" height="14" rx="7" />
                      <rect x="360" y="260" width="64" height="10" rx="5" />
                      <rect x="500" y="420" width="130" height="14" rx="7" />
                      <rect x="530" y="440" width="70" height="10" rx="5" />
                    </g>
                  ))}
                </g>
              </g>
              <rect ref={white} x={SKY.x} y={SKY.y} width={SKY.w} height={SKY.h} fill="#fff" opacity="0" />
            </g>

            {/* telaio, davanzale, anta */}
            <g ref={frame}>
              <rect x="276" y="142" width="460" height="740" rx="8" fill={ink} fillOpacity="0.05" />
              <rect x="270" y="130" width="460" height="740" rx="8" fill="#fff" stroke={ink} strokeWidth="1.6" {...ne} />
              <rect x="282" y="142" width="436" height="716" rx="4" fill="none" stroke={ink} strokeOpacity="0.2" {...ne} />
              <rect x={SKY.x} y={SKY.y} width={SKY.w} height={SKY.h} fill="none" stroke={ink} strokeOpacity="0.55" strokeWidth="1.2" {...ne} />
              <rect x="250" y="870" width="500" height="22" rx="3" fill="#f1f3f5" stroke={ink} strokeOpacity="0.55" {...ne} />
              <polygon
                ref={sash}
                fill="#fff"
                stroke={ink}
                strokeWidth="1.6"
                strokeLinejoin="round"
                points={poly([[SKY.x, SKY.y], [SKY.x + SKY.w, SKY.y], [SKY.x + SKY.w, SKY.y + SKY.h], [SKY.x, SKY.y + SKY.h]])}
                {...ne}
              />
              <polygon
                ref={glass}
                fill="url(#si-glass)"
                stroke={ink}
                strokeOpacity="0.5"
                strokeLinejoin="round"
                points={poly([[SKY.x + 26, SKY.y + 26], [SKY.x + SKY.w - 26, SKY.y + 26], [SKY.x + SKY.w - 26, SKY.y + SKY.h - 26], [SKY.x + 26, SKY.y + SKY.h - 26]])}
                {...ne}
              />
              <circle cx={HINGE_X} cy="240" r="5" fill={ink} />
              <circle cx={HINGE_X} cy="760" r="5" fill={ink} />
              <polygon ref={handle} fill="#cc1f2b" points="676,450 688,450 688,560 676,560" />
            </g>
          </g>
        </svg>

        <div ref={cue} className="absolute inset-x-0 bottom-7 flex justify-center text-ink-mute" aria-hidden>
          <ChevronDown size={26} strokeWidth={1.5} className="animate-bounce" aria-label={t("scrollDown")} />
        </div>
      </div>
    </div>
  );
}
