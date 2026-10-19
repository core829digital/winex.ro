"use client";

import { useEffect, useRef } from "react";
import { parseOneSpecResize } from "@/lib/onespec";

type Props = { src: string; title: string; publicId: string; origin: string };

/** Configuratore OneSpec incorporato (iframe ufficiale) con adattamento automatico dell'altezza. */
export function OneSpecEmbed({ src, title, publicId, origin }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const h = parseOneSpecResize(e.origin, e.data, publicId, origin);
      if (h !== null && frame.current) frame.current.style.height = `${h}px`;
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [publicId, origin]);

  return (
    <iframe
      ref={frame}
      src={src}
      title={title}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      style={{ width: "100%", border: 0, minHeight: 640, display: "block" }}
    />
  );
}
