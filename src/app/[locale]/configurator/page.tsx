import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { pageMetadata } from "@/i18n/seo";
import { Link } from "@/i18n/navigation";
import { oneSpec } from "@/lib/site";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { OneSpecEmbed } from "@/components/configurator/OneSpecEmbed";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/configurator", "configurator");
}

export default async function ConfiguratorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("configurator");
  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} line1={t("titleLine1")} line2={t("titleLine2")} lead={t("lead")} />

      <section className="py-12 sm:py-16">
        <div className="container-x">
          <Reveal as="ol" variant="group" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3.5 rounded-[var(--r-card)] border border-line bg-white px-4 py-3.5 text-sm font-semibold">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red text-xs font-bold text-white tabular-nums">{i + 1}</span>
                {s}
              </li>
            ))}
          </Reveal>

          <Reveal>
            <div className="surface overflow-hidden shadow-[var(--shadow-md)]">
              <OneSpecEmbed src={oneSpec.embedUrl} title={t("iframeTitle")} publicId={oneSpec.publicId} origin={oneSpec.origin} />
            </div>
          </Reveal>

          <div className="mt-6 flex flex-col gap-3 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
            <p>
              {t("help")}{" "}
              <Link href="/contact" className="font-semibold text-red-deep underline underline-offset-2 hover:text-red">{t("helpLink")}</Link>
            </p>
            <a href={oneSpec.pageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-ink hover:text-red-deep">
              {t("openNew")} <ExternalLink size={15} aria-hidden />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
