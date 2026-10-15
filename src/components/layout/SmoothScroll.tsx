"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Smooth scroll globale (Lenis). Disattivato con prefers-reduced-motion. */
export function SmoothScroll() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, anchors: true });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
