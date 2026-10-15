import { clsx } from "clsx";
import Image from "next/image";

type Props = {
  /** Percorso in /public (es. "/photos/fabrica-01.jpg"). Se assente, mostra il segnaposto. */
  src?: string;
  alt: string;
  label: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

/**
 * Slot fotografico: quando arrivano le foto reali basta passare `src`.
 * Fino ad allora mostra un segnaposto elegante, chiaramente marcato.
 */
export function PhotoSlot({ src, alt, label, className, priority, sizes = "(min-width: 1024px) 50vw, 100vw" }: Props) {
  return (
    <div className={clsx("relative overflow-hidden rounded-3xl glass", className)}>
      {src ? (
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_90%_at_20%_0%,rgba(220,36,48,0.10),transparent_60%),linear-gradient(135deg,#fafafa,#efeff1)]"
        >
          <svg viewBox="0 0 64 64" className="h-12 w-12 text-ink-mute/60" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <rect x="8" y="14" width="48" height="36" rx="5" />
            <circle cx="24" cy="28" r="4" />
            <path d="m10 46 14-12 10 8 8-6 12 10" />
          </svg>
          <span className="absolute bottom-4 left-4 right-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink-mute">
            Foto în curând · {label}
          </span>
        </div>
      )}
    </div>
  );
}
