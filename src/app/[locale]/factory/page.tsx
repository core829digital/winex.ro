import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { pageMetadata } from "@/i18n/seo";
import { PageHero } from "@/components/ui/PageHero";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CtaBand } from "@/components/home/CtaBand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/factory", "factory");
}

// Quando arrivano le foto: copiarle in /public/photos e valorizzare `src`.
const GALLERY = [
  { key: "exterior", cls: "md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto md:min-h-[26rem]" },
  { key: "cutting", cls: "aspect-[4/3]" },
  { key: "welding", cls: "aspect-[4/3]" },
  { key: "assembly", cls: "aspect-[4/3]" },
  { key: "quality", cls: "aspect-[4/3]" },
  { key: "dispatch", cls: "md:col-span-2 aspect-[16/7]" },
] as const;

export default async function FactoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("factory");
  const stages = (["raw", "cut", "assemble", "qc"] as const).map((k, i) => ({ n: String(i + 1).padStart(2, "0"), title: t(k), text: t(`${k}Text`) }));

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} line1={t("titleLine1")} line2={t("titleLine2")} lead={t("lead")} />

      <section className="py-12 sm:py-16">
        <Reveal variant="group" className="container-x grid gap-4 md:grid-cols-4">
          {GALLERY.map((g) => (
            <PhotoSlot key={g.key} alt={t(g.key)} caption={t(g.key)} className={`h-full w-full ${g.cls}`} />
          ))}
        </Reveal>
      </section>

      <section className="section section-soft border-y border-line">
        <div className="container-x">
          <SectionHeading eyebrow={t("stagesEyebrow")} title={t("stagesTitle")} />
          <Reveal variant="group" className="mt-12 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((s) => (
              <div key={s.n} className="border-t border-[var(--line-strong)] py-8">
                <span className="font-display text-sm font-bold tracking-[0.14em] text-red-deep tabular-nums">{s.n}</span>
                <h3 className="mt-4 text-xl">{s.title}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{s.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
