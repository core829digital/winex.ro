"use client";

import { useRef, type ElementType, type ReactNode, type PointerEvent } from "react";
import { clsx } from "clsx";

type Props = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  strong?: boolean;
  interactive?: boolean;
};

/** Superficie in vetro con riflesso che segue il puntatore (effetto "spatial"). */
export function GlassCard({ children, className, as: Tag = "div", strong, interactive = true }: Props) {
  const ref = useRef<HTMLElement>(null);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <Tag
      ref={ref}
      onPointerMove={interactive ? onMove : undefined}
      className={clsx(strong ? "glass-strong" : "glass", interactive && "spatial", "rounded-3xl", className)}
    >
      {children}
    </Tag>
  );
}
