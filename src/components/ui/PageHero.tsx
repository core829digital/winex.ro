import type { ReactNode } from "react";

/** Testata delle pagine interne: titolo a due righe con ingresso a maschera, griglia tecnica di fondo. */
export function PageHero({ eyebrow, line1, line2, lead, children }: { eyebrow: string; line1: string; line2?: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      <div className="bg-grid absolute inset-0 -z-10" aria-hidden />
      <div className="container-x pb-14 pt-16 sm:pb-20 sm:pt-24">
        <p className="eyebrow rise">{eyebrow}</p>
        <h1 className="h-display mt-6 max-w-4xl">
          <span className="line-mask"><span style={{ "--d": "80ms" } as React.CSSProperties}>{line1}</span></span>
          {line2 && (
            <span className="line-mask"><span className="text-red-deep" style={{ "--d": "200ms" } as React.CSSProperties}>{line2}</span></span>
          )}
        </h1>
        {lead && (
          <p className="lead rise mt-7 max-w-2xl" style={{ "--d": "380ms" } as React.CSSProperties}>
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
