import { clsx } from "clsx";
import Image from "next/image";

type Props = {
  /** Percorso in /public (es. "/photos/fabrica-01.jpg"). Se assente, mostra un riquadro tecnico neutro. */
  src?: string;
  alt: string;
  caption: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

/**
 * Slot fotografico: quando arrivano le foto reali basta passare `src`.
 * Fino ad allora: riquadro tecnico neutro con la didascalia del soggetto (nessun testo "in arrivo").
 */
export function PhotoSlot({ src, alt, caption, className, priority, sizes = "(min-width: 1024px) 50vw, 100vw" }: Props) {
  return (
    <figure className={clsx("relative overflow-hidden rounded-[var(--r-card)] border border-line bg-[#eceef1]", className)}>
      {src ? (
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      ) : (
        <div role="img" aria-label={alt} className="absolute inset-0">
          <svg className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <defs>
              <pattern id="ps-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0H0V32" fill="none" stroke="rgba(31,35,40,0.07)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ps-grid)" />
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(31,35,40,0.06)" />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="rgba(31,35,40,0.06)" />
          </svg>
        </div>
      )}
      <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/45 to-transparent px-4 pb-3.5 pt-8 text-xs font-semibold tracking-wide text-white">
        <span className="h-px w-5 bg-white/80" />
        {caption}
      </figcaption>
    </figure>
  );
}
