"use client";

import { useEffect, useRef } from "react";

/**
 * Sfondo "flusso di energia": nastri sinusoidali rosso→arancio su bianco.
 *
 * Performance (mobile-first):
 *  - Profilo leggero su touch/schermi piccoli: DPR 1, 4 nastri, passo largo, 24 fps.
 *  - Profilo pieno su desktop: DPR ≤ 1.5, 7 nastri, 45 fps.
 *  - In pausa durante lo scroll, a scheda nascosta e con reduced-motion (frame statico).
 *  - Gradienti precalcolati (nessuna allocazione per frame).
 *  - Nessun ridimensionamento quando cambia solo l'altezza (barra URL mobile).
 *  - Auto-spegnimento: se il disegno costa troppo per questo dispositivo, resta un frame statico.
 */
export function EnergyFlow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lite = window.matchMedia("(hover: none), (max-width: 767px)").matches;

    const LINES = lite ? 4 : 7;
    const STEP = lite ? 34 : 18;
    const FRAME_MS = lite ? 1000 / 24 : 1000 / 45;
    const MAX_COST_MS = lite ? 6 : 9; // costo medio massimo accettato per frame

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let scrolling = false;
    let scrollTimer = 0;
    let lastFrame = 0;
    let cost = 0; // media mobile del costo di disegno
    let px = 0.5;
    let spx = 0.5;
    let grads: CanvasGradient[] = [];
    const t0 = performance.now();

    const build = () => {
      const dpr = lite ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      grads = [];
      for (let i = 0; i < LINES; i++) {
        const k = i / (LINES - 1);
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, "rgba(220,36,48,0)");
        g.addColorStop(0.3, `rgba(220,36,48,${0.16 - k * 0.05})`);
        g.addColorStop(0.65, `rgba(255,112,64,${0.14 - k * 0.04})`);
        g.addColorStop(1, "rgba(220,36,48,0)");
        grads.push(g);
      }
    };

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      spx += (px - spx) * 0.04;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      for (let i = 0; i < LINES; i++) {
        const k = i / (LINES - 1);
        const baseY = h * (0.12 + k * 0.78);
        const amp = 38 + k * 46;
        const freq = 0.0016 + k * 0.0007;
        const speed = 0.22 + k * 0.1;
        const phase = i * 1.7 + (spx - 0.5) * 1.2;
        ctx.strokeStyle = grads[i];
        ctx.lineWidth = 1.2 + (1 - k) * 1.6;
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += STEP) {
          const y =
            baseY +
            Math.sin(x * freq + t * speed + phase) * amp +
            Math.sin(x * freq * 2.3 - t * speed * 0.7 + phase * 1.3) * (amp * 0.35);
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (scrolling || now - lastFrame < FRAME_MS) return;
      lastFrame = now;
      const s = performance.now();
      draw(now);
      cost = cost * 0.9 + (performance.now() - s) * 0.1;
      if (cost > MAX_COST_MS) stop(); // dispositivo troppo lento: frame statico
    };
    const start = () => {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    const onVis = () => (document.hidden ? stop() : start());
    const onScroll = () => {
      scrolling = true;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => (scrolling = false), 140);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX / Math.max(w, 1);
    };
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    const onResize = () => {
      // La barra URL mobile cambia solo l'altezza di pochi px: ignora, evita realloc del canvas.
      if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 160) return;
      lastW = window.innerWidth;
      lastH = window.innerHeight;
      build();
      draw(performance.now());
    };

    build();
    draw(performance.now());
    start();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!lite) window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      window.clearTimeout(scrollTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
