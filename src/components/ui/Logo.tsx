import { clsx } from "clsx";
import Image from "next/image";

/**
 * Logo ufficiale WINEX (da branding/WINEX-ADVANCE-REBUILT.png, generato con `npm run brand`).
 * `inverse`: variante con «EX» bianco per i fondi scuri. Rapporto 883 × 240.
 */
const W = 883;
const H = 240;

export function Logo({ className, inverse, priority }: { className?: string; inverse?: boolean; priority?: boolean }) {
  return (
    <Image
      src={inverse ? "/brand/winex-logo-inverse.webp" : "/brand/winex-logo.webp"}
      alt="Winex"
      width={W}
      height={H}
      priority={priority}
      unoptimized
      className={clsx("block h-8 w-auto select-none", className)}
      draggable={false}
    />
  );
}
