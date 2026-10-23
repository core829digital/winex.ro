"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Linea-guida a scorrimento: un tracciato curvo che scende lungo la pagina e, sezione dopo sezione,
 * passa da un margine all'altro. Si "disegna" mentre si scorre; a ogni sezione c'è un punto che si accende
 * quando la linea lo raggiunge. Le sezioni sono i figli diretti di questo contenitore.
 * Su schermi stretti la linea corre lungo il bordo sinistro. Con «riduci movimento» è già tutta disegnata.
 */

type Node = { x: number; y: number };
type Layout = { w: number; h: number; d: string; nodes: Node[] };

const MAX_CONTENT = 1216; // .container-x max-width (76rem)

function build(wrap: HTMLElement, content: HTMLElement): Layout | null {
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  const kids = [...content.children].filter((el): el is HTMLElement => el instanceof HTMLElement && el.offsetHeight > 40);
  if (!w || !h || kids.length === 0) return null;

  const base = wrap.getBoundingClientRect().top;
  const boxes = kids.map((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top - base, bottom: r.bottom - base };
  });

  const wide = w >= 1024;
  const gutter = Math.max(0, (w - Math.min(w, MAX_CONTENT)) / 2);
  const xL = wide ? Math.max(18, gutter * 0.5 + 10) : 8;
  const xR = wide ? w - xL : xL;
  const amp = wide ? 14 : 4; // ondulazione dei tratti verticali (mai una retta)

  const nodes: Node[] = [];
  let d = "";
  let x = xL;
  let y = boxes[0].top + 36;
  d += `M${x.toFixed(1)} ${y.toFixed(1)}`;

  /** tratto verticale ondulato da y a y2 sulla corsia x */
  const wave = (y2: number) => {
    const n = Math.max(1, Math.round((y2 - y) / 260));
    const step = (y2 - y) / n;
    for (let i = 0; i < n; i++) {
      const a = y + step * i;
      const b = a + step;
      const s = i % 2 === 0 ? 1 : -1;
      d += `C${(x + s * amp).toFixed(1)} ${(a + step * 0.33).toFixed(1)} ${(x + s * amp).toFixed(1)} ${(a + step * 0.66).toFixed(1)} ${x.toFixed(1)} ${b.toFixed(1)}`;
    }
    y = y2;
  };

  boxes.forEach((b, i) => {
    // il punto della sezione sta esattamente dove arriva la linea (prima sezione: poco sotto l'inizio)
    if (i === 0) wave(Math.max(y + 24, b.top + 120));
    nodes.push({ x, y });
    const next = boxes[i + 1];
    if (!next) {
      wave(Math.max(y + 40, b.bottom - 48));
      return;
    }
    const leave = Math.max(y + 40, b.bottom - 70);
    wave(leave);
    const arrive = next.top + 92;
    const nx = wide ? (x === xL ? xR : xL) : xL;
    const mid = (leave + arrive) / 2;
    // incrocio morbido a "S" sopra il confine tra le due sezioni (nei margini interni, non sul testo)
    d += `C${x.toFixed(1)} ${mid.toFixed(1)} ${nx.toFixed(1)} ${mid.toFixed(1)} ${nx.toFixed(1)} ${arrive.toFixed(1)}`;
    x = nx;
    y = arrive;
  });

  return { w, h, d, nodes };
}

export function ScrollTrail({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const head = useRef<SVGCircleElement>(null);
  const nodesG = useRef<SVGGElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);

  // Misura le sezioni e costruisce il tracciato (ricalcolato quando cambiano dimensioni o contenuti).
  useEffect(() => {
    const wEl = wrap.current;
    const cEl = content.current;
    if (!wEl || !cEl) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setLayout(build(wEl, cEl)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wEl);
    for (const el of cEl.children) ro.observe(el);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // Disegno legato allo scroll: lunghezza tracciata = punto della linea all'altezza del 62% dello schermo.
  useEffect(() => {
    const path = line.current;
    const wEl = wrap.current;
    if (!path || !wEl || !layout) return;
    const total = path.getTotalLength();
    const STEP = 6;
    const ys: number[] = [];
    const xs: number[] = [];
    for (let l = 0; l <= total; l += STEP) {
      const pt = path.getPointAtLength(l);
      xs.push(pt.x);
      ys.push(pt.y);
    }
    path.style.strokeDasharray = `${total} ${total}`;
    const dots = nodesG.current ? [...nodesG.current.querySelectorAll<SVGGElement>("[data-node]")] : [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const render = () => {
      raf = 0;
      const target = reduce ? Infinity : -wEl.getBoundingClientRect().top + window.innerHeight * 0.62;
      // ricerca binaria dell'ultimo campione sopra la soglia (il tracciato scende sempre)
      let lo = 0;
      let hi = ys.length - 1;
      if (ys[0] > target) hi = -1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (ys[mid] <= target) lo = mid;
        else hi = mid - 1;
      }
      const idx = hi;
      const len = idx < 0 ? 0 : Math.min(total, idx * STEP);
      path.style.strokeDashoffset = String(total - len);
      if (head.current) {
        const show = idx >= 0 && len < total - 1;
        head.current.style.opacity = show ? "1" : "0";
        if (idx >= 0) {
          head.current.setAttribute("cx", xs[idx].toFixed(1));
          head.current.setAttribute("cy", ys[idx].toFixed(1));
        }
      }
      const yNow = idx < 0 ? -Infinity : ys[idx];
      layout.nodes.forEach((n, i) => dots[i]?.classList.toggle("is-on", n.y <= yNow + 1));
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
    };
  }, [layout]);

  return (
    <div ref={wrap} className="relative">
      <div ref={content}>{children}</div>
      {layout && (
        <svg className="scroll-trail" width={layout.w} height={layout.h} viewBox={`0 0 ${layout.w} ${layout.h}`} aria-hidden>
          {/* percorso ancora da fare: tratteggio leggero */}
          <path d={layout.d} className="scroll-trail__route" />
          {/* percorso fatto */}
          <path ref={line} d={layout.d} className="scroll-trail__line" />
          <g ref={nodesG}>
            {layout.nodes.map((n, i) => (
              <g key={i} data-node className="scroll-trail__node" transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`}>
                <circle r="13" className="scroll-trail__halo" />
                <circle r="6" className="scroll-trail__dot" />
              </g>
            ))}
          </g>
          <circle ref={head} r="4" className="scroll-trail__head" />
        </svg>
      )}
    </div>
  );
}
