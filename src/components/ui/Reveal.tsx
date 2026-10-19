"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { clsx } from "clsx";

type Props = {
  children?: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  /** "group": i figli entrano in sequenza (stagger). "rule": linea che si disegna. Default: singolo elemento. */
  variant?: "single" | "group" | "rule";
};

// Un solo observer condiviso da tutte le istanze (meno overhead su mobile).
let shared: IntersectionObserver | null = null;
function observer() {
  if (!shared) {
    shared = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            shared?.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );
  }
  return shared;
}

/** Rivela il contenuto quando entra nel viewport (una sola volta; solo opacity/transform). */
export function Reveal({ children, as: Tag = "div", delay = 0, className, variant = "single" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = observer();
    io.observe(el);
    return () => io.unobserve(el);
  }, []);

  return (
    <Tag
      ref={ref}
      className={clsx(variant === "group" ? "reveal-group" : variant === "rule" ? "rule-draw" : "reveal", className)}
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
