import { getTranslations } from "next-intl/server";
import { Layers, Headset, Workflow, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getCompany } from "@/lib/company";

/**
 * Profili di qualità, assistenza e sistema digitale, poi invito a chiamare.
 * Tema chiaro come il resto del sito (sfondo tenue, antracite, accento rosso). Il numero arriva dai dati societari.
 */
export async function Support() {
  const [t, nav, c] = await Promise.all([getTranslations("support"), getTranslations("nav"), getCompany()]);
  const items = [
    { icon: Layers, title: t("p1Title"), text: t("p1Text") },
    { icon: Headset, title: t("p2Title"), text: t("p2Text") },
    { icon: Workflow, title: t("p3Title"), text: t("p3Text") },
  ];
  const tel = c.phone ? `tel:${c.phone.replace(/[^+\d]/g, "")}` : null;

  return (
    <section className="section section-soft cv-auto relative isolate overflow-hidden border-y border-line">
      <div className="bg-grid absolute inset-0 -z-10 opacity-70" aria-hidden />
      <div className="container-x">
        <SectionHeading index="04" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

        <Reveal variant="group" className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="surface accent-bar p-7 sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-[var(--r-btn)] border border-line bg-white text-red">
                <it.icon size={24} strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="mt-6 text-xl">{it.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{it.text}</p>
            </div>
          ))}
        </Reveal>

        <Reveal delay={150} className="surface mt-5 flex flex-col gap-6 p-7 shadow-[var(--shadow-md)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-red-soft text-red">
              <Phone size={22} strokeWidth={1.6} aria-hidden />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-ink">{t("callNote")}</p>
              {c.phone && <p className="mt-0.5 text-sm tabular-nums text-ink-soft">{c.phone}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {tel ? (
              <a
                href={tel}
                className="inline-flex items-center justify-center gap-2.5 rounded-[var(--r-btn)] bg-red px-7 py-3.5 text-[0.9375rem] font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.12)] transition-colors hover:bg-red-deep"
              >
                <Phone size={18} aria-hidden />
                {t("call")}
              </a>
            ) : null}
            <ButtonLink href="/contact" variant="outline" arrow>
              {nav("contact")}
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
