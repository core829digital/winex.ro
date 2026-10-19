import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { pageMetadata } from "@/i18n/seo";
import { getCompany } from "@/lib/company";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/forms/ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/contact", "contact");
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, c] = await Promise.all([getTranslations("contact"), getCompany()]);

  // I campi non compilati nell'admin non vengono mostrati.
  const rows = [
    { icon: MapPin, label: t("address"), value: c.address, href: undefined as string | undefined },
    { icon: Phone, label: t("phone"), value: c.phone, href: c.phone ? `tel:${c.phone.replace(/[^+\d]/g, "")}` : undefined },
    { icon: Mail, label: t("email"), value: c.email, href: c.email ? `mailto:${c.email}` : undefined },
    { icon: Clock, label: t("hours"), value: c.hours, href: undefined },
  ].filter((r) => r.value);

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} line1={t("titleLine1")} line2={t("titleLine2")} lead={t("lead")} />
      <section className="section !pt-14">
        <div className="container-x grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
          <Reveal>
            <div className="surface accent-bar self-start p-8">
              <h2 className="text-xl">{t("infoTitle")}</h2>
              {rows.length > 0 ? (
                <ul className="mt-7 space-y-6">
                  {rows.map((r) => (
                    <li key={r.label} className="flex gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-btn)] border border-line text-red">
                        <r.icon size={18} strokeWidth={1.7} aria-hidden />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">{r.label}</p>
                        {r.href ? (
                          <a href={r.href} className="mt-1 block text-ink hover:text-red-deep hover:underline">{r.value}</a>
                        ) : (
                          <p className="mt-1 whitespace-pre-line text-ink">{r.value}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-ink-soft">{t("noDetails")}</p>
              )}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="surface p-8 sm:p-10">
              <h2 className="text-xl">{t("formTitle")}</h2>
              <div className="mt-7">
                <ContactForm />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
