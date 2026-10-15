import type { ReactNode } from "react";
import { PageHero } from "./PageHero";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} lead={`Ultima actualizare: ${updated}`} />
      <section className="px-4 pb-24 sm:px-6">
        <article className="glass-strong mx-auto max-w-3xl rounded-[2rem] p-7 sm:p-12 [&_a]:font-semibold [&_a]:text-red-deep [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2:first-child]:mt-0 [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:text-ink-soft [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-ink-soft">
          {children}
        </article>
      </section>
    </>
  );
}
