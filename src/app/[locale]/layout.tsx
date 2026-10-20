import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { routing, localeMeta, type Locale } from "@/i18n/routing";
import { alternatesFor } from "@/i18n/seo";
import { site } from "@/lib/site";
import { getCompany } from "@/lib/company";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EnergyFlow } from "@/components/visual/EnergyFlow";
import { Tracker } from "@/components/layout/Tracker";
import { ScrollProgress } from "@/components/layout/ScrollProgress";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const alternates = alternatesFor(locale, "/");
  return {
    metadataBase: new URL(site.url),
    title: { default: t("title"), template: `%s · ${site.name}` },
    description: t("description"),
    applicationName: site.name,
    alternates,
    openGraph: { type: "website", locale: localeMeta[locale].og, siteName: site.name, title: t("title"), description: t("description"), url: alternates.canonical },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

// Solo i namespace usati dai componenti client (payload HTML ridotto).
const CLIENT_NAMESPACES = ["nav", "common", "forms"] as const;

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [all, t] = await Promise.all([getMessages(), getTranslations({ locale, namespace: "common" })]);
  const messages = Object.fromEntries(CLIENT_NAMESPACES.map((k) => [k, (all as Record<string, unknown>)[k]]));

  const company = await getCompany();
  const sameAs = [company.facebook, company.instagram, company.linkedin].filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#org`,
        name: site.name,
        legalName: company.legalName,
        url: site.url,
        slogan: t("tagline"),
        address: { "@type": "PostalAddress", ...(company.address ? { streetAddress: company.address } : {}), addressCountry: site.country },
        ...(company.phone ? { telephone: company.phone } : {}),
        ...(company.email ? { email: company.email } : {}),
        ...(sameAs.length ? { sameAs } : {}),
      },
      { "@type": "WebSite", "@id": `${site.url}/#site`, url: site.url, name: site.name, inLanguage: locale, publisher: { "@id": `${site.url}/#org` } },
    ],
  };

  return (
    <html lang={locale as Locale}>
      <body className="min-h-dvh overflow-x-clip">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--r-btn)] focus:bg-red focus:px-5 focus:py-3 focus:text-white"
          >
            {t("skip")}
          </a>
          <EnergyFlow />
          <SmoothScroll />
          <ScrollProgress />
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <Tracker />
        </NextIntlClientProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
