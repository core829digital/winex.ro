import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Hero } from "@/components/home/Hero";
import { ScrollWindowIntro } from "@/components/home/ScrollWindowIntro";
import { Materials } from "@/components/home/Materials";
import { ProfileShowcase } from "@/components/home/ProfileShowcase";
import { Energy } from "@/components/home/Energy";
import { Process } from "@/components/home/Process";
import { Support } from "@/components/home/Support";
import { ScrollTrail } from "@/components/visual/ScrollTrail";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { newsletterEnabled } from "@/lib/server";

export async function generateMetadata(): Promise<Metadata> {
  return {}; // titolo, descrizione e hreflang dal layout
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <>
      <ScrollWindowIntro />
      {/* Linea-guida a scorrimento: un punto per ogni sezione figlia */}
      <ScrollTrail>
        <div className="hero-wrap relative">
          <Hero />
        </div>
        <Materials />
        <ProfileShowcase />
        <Energy />
        <Process />
        <Support />
        {/* La newsletter richiede Convex + Resend (doppia conferma): senza, la sezione non viene mostrata. */}
        {newsletterEnabled() && <NewsletterSection />}
      </ScrollTrail>
    </>
  );
}
