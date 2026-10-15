import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, lead }: { eyebrow: string; title: ReactNode; lead?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-14 pt-36 sm:px-6 sm:pt-44">
      <div className="aurora" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow rise">{eyebrow}</p>
        <h1 className="rise mt-5 max-w-4xl text-[clamp(2.4rem,5.6vw,4.6rem)] font-extrabold" style={{ "--d": "100ms" } as React.CSSProperties}>
          {title}
        </h1>
        {lead && (
          <p className="rise mt-6 max-w-2xl text-lg text-ink-soft sm:text-xl" style={{ "--d": "220ms" } as React.CSSProperties}>
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
