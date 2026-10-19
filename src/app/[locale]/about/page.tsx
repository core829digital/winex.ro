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
  return pageMetadata(locale as Locale, "/about", "about");
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const values = (["precision", "efficiency", "craft", "reliability"] as const).map((k, i) => ({
    n: String(i + 1).padStart(2, "0"),
    title: t(`${k}Title`),
    text: t(`${k}Text`),
  }));

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} line1={t("titleLine1")} line2={t("titleLine2")} lead={t("lead")} />

      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 className="h-section">{t("storyTitle")}</h2>
            <div className="mt-6 space-y-5 text-[1.0625rem] leading-relaxed text-ink-soft">
              <p>{t("story1")}</p>
              <p>{t("story2")}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <PhotoSlot alt={t("photoCaption")} caption={t("photoCaption")} className="aspect-[4/3]" />
          </Reveal>
        </div>
      </section>

      <section className="section section-soft border-y border-line">
        <div className="container-x">
          <SectionHeading eyebrow={t("valuesEyebrow")} title={t("valuesTitle")} />
          <Reveal variant="group" className="mt-12 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.n} className="border-t border-[var(--line-strong)] py-8">
                <span className="font-display text-sm font-bold tracking-[0.14em] text-red-deep tabular-nums">{v.n}</span>
                <h3 className="mt-4 text-xl">{v.title}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{v.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
