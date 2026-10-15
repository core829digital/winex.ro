"use client";

import { useEffect, useRef } from "react";
import { MapPin, Zap } from "lucide-react";

/**
 * Scena "spatial" dell'hero: finestra in vetro a più livelli (Z) che reagisce al puntatore.
 * - Nessun re-render React: la trasformazione è scritta direttamente sul DOM via rAF.
 * - Disattivata con reduced-motion e su dispositivi touch.
 */
export function HeroScene() {
  const stage = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    const r = rig.current;
    if (!el || !r) return;

    // Metti in pausa animazioni CSS e SMIL quando la scena non è visibile.
    const svg = el.querySelector<SVGSVGElement>('svg[viewBox="0 0 400 420"]');
    const io = new IntersectionObserver(([entry]) => {
      el.dataset.paused = entry.isIntersecting ? "false" : "true";
      if (entry.isIntersecting) svg?.unpauseAnimations?.();
      else svg?.pauseAnimations?.();
    });
    io.observe(el);

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(hover: none)").matches
    )
      return () => io.disconnect();

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      r.style.transform = `rotateX(${(-cy * 9).toFixed(2)}deg) rotateY(${(cx * 12).toFixed(2)}deg)`;
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      // normalizzato rispetto al centro della scena, limitato a [-1,1]
      tx = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width - 0.5) * 2));
      ty = Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height - 0.5) * 2));
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={stage}
      className="scene-stage relative mx-auto aspect-[5/6] w-full max-w-[540px]"
    >
      <div
        ref={rig}
        className="scene-rig absolute inset-0"
        style={{ transition: "transform 0.15s linear" }}
      >
        {/* Alone di luce dietro la finestra */}
        <div
          aria-hidden
          className="z3d absolute inset-[-4%] rounded-full bg-[radial-gradient(closest-side,rgba(220,36,48,0.26),rgba(255,120,90,0.11)_55%,transparent)]"
          style={{ "--z": "-120px" } as React.CSSProperties}
        />

        {/* Telaio */}
        <div
          className="absolute inset-x-[9%] inset-y-[5%] rounded-[2.2rem] bg-[linear-gradient(150deg,#ffffff,#eceef0_70%,#e2e4e7)] p-[5.5%] shadow-[0_50px_90px_-30px_rgba(37,40,45,0.45),0_0_0_1px_rgba(37,40,45,0.06),inset_0_2px_0_#fff,inset_0_-3px_6px_rgba(37,40,45,0.08)]"
        >
          {/* Vetrate */}
          <div className="relative grid h-full grid-cols-2 gap-[3.2%] rounded-[1.4rem] bg-[#d9dcdf] p-[3.2%] shadow-[inset_0_3px_10px_rgba(37,40,45,0.18)]">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-[0.9rem] bg-[linear-gradient(165deg,rgba(255,255,255,0.95),rgba(255,214,205,0.55)_45%,rgba(220,36,48,0.22))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9),inset_0_0_30px_rgba(220,36,48,0.1)]"
              >
                {/* riflesso */}
                <div
                  aria-hidden
                  className="absolute -inset-y-1/2 -left-1/3 w-2/3 rotate-[24deg] bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80"
                />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.5),transparent_38%)]" />
                {/* maniglia */}
                <span
                  aria-hidden
                  className={`absolute top-1/2 h-[16%] w-[3.4%] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#fff,#c9ccd0)] shadow-[0_2px_6px_rgba(37,40,45,0.3)] ${
                    i === 0 ? "right-[5%]" : "left-[5%]"
                  }`}
                />
              </div>
            ))}

            {/* Flusso di energia che resta dentro la casa */}
            <svg
              viewBox="0 0 400 420"
              className="pointer-events-none absolute inset-0 h-full w-full"
              fill="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="hf" x1="0" x2="1">
                  <stop offset="0" stopColor="#dc2430" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#dc2430" stopOpacity="0.95" />
                  <stop offset="1" stopColor="#ff7a50" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[
                "M-10 300 C 90 230, 150 360, 250 290 S 380 230, 420 260",
                "M-10 220 C 80 160, 170 290, 260 210 S 370 150, 420 180",
                "M-10 140 C 100 100, 170 190, 260 130 S 360 90, 420 110",
              ].map((d, i) => (
                <g key={d}>
                  <path d={d} stroke="url(#hf)" strokeWidth="9" strokeLinecap="round" opacity="0.18" />
                  <path
                    d={d}
                    stroke="url(#hf)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    className="flow-dash"
                    style={{ animationDuration: `${12 + i * 3}s` }}
                  />
                </g>
              ))}
              <circle className="hero-dot" r="4.5" fill="#dc2430">
                <animateMotion dur="6s" repeatCount="indefinite" path="M-10 300 C 90 230, 150 360, 250 290 S 380 230, 420 260" />
              </circle>
              <circle className="hero-dot" r="3.5" fill="#ff7a50">
                <animateMotion dur="8s" begin="-3s" repeatCount="indefinite" path="M-10 220 C 80 160, 170 290, 260 210 S 370 150, 420 180" />
              </circle>
            </svg>
          </div>
        </div>

        {/* Chip: efficienza */}
        <div className="z3d absolute left-[-2%] top-[14%]" style={{ "--z": "110px" } as React.CSSProperties}>
          <div className="glass-strong float-y rounded-2xl p-3.5 pr-5" style={{ "--d": "0s" } as React.CSSProperties}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-red text-white shadow-[0_8px_18px_-6px_rgba(220,36,48,0.7)]">
                <Zap size={20} />
              </span>
              <div>
                <p className="font-display text-sm font-bold leading-tight text-ink">Eficiență energetică</p>
                <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-black/[0.07]">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-red to-[#ff7a50]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chip: materiali */}
        <div className="z3d absolute right-[-3%] top-[47%]" style={{ "--z": "150px" } as React.CSSProperties}>
          <div className="glass-strong float-y rounded-2xl px-4 py-3" style={{ "--d": "-2.3s" } as React.CSSProperties}>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink-mute">Materiale</p>
            <ul className="mt-1.5 space-y-1 font-display text-sm font-bold text-ink">
              {["PVC", "Aluminiu", "Lemn"].map((m) => (
                <li key={m} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Chip: origine */}
        <div className="z3d absolute bottom-[7%] left-[3%]" style={{ "--z": "80px" } as React.CSSProperties}>
          <div className="glass-strong float-y flex items-center gap-2.5 rounded-full py-2.5 pl-3 pr-5" style={{ "--d": "-4.1s" } as React.CSSProperties}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-red-soft text-red-deep">
              <MapPin size={16} />
            </span>
            <span className="font-display text-sm font-bold text-ink">Produs la Roman</span>
          </div>
        </div>
      </div>
    </div>
  );
}
