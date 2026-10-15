"use client";

import { useEffect, useRef } from "react";

/**
 * Sfondo "flusso di energia": nastri sinusoidali rosso→arancio su bianco.
 * Performance: DPR ≤ 1.5, pausa a scheda nascosta / fuori viewport, frame statico con reduced-motion.
 */
export function EnergyFlow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let px = 0.5; // puntatore normalizzato
    let spx = 0.5;
    const t0 = performance.now();

    const LINES = 7;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, "rgba(220,36,48,0)");
        g.addColorStop(0.3, `rgba(220,36,48,${0.16 - k * 0.05})`);
        g.addColorStop(0.65, `rgba(255,112,64,${0.14 - k * 0.04})`);
        g.addColorStop(1, "rgba(220,36,48,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2 + (1 - k) * 1.6;

        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += 18) {
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
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onVis = () => (document.hidden ? stop() : start());
    const onMove = (e: PointerEvent) => {
      px = e.clientX / Math.max(w, 1);
    };

    resize();
    draw(performance.now());
    start();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
