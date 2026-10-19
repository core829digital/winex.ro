import type { Metadata } from "next";
import { Suspense } from "react";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { pageMetadata } from "@/i18n/seo";
import { ConfirmSubscriptionForm } from "@/components/forms/ConfirmSubscriptionForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/confirm-subscription", "confirm", { index: false });
}

export default async function ConfirmSubscriptionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("forms.confirm");
  return (
    <section className="grid min-h-[70dvh] place-items-center px-4 py-24">
      <div className="surface accent-bar w-full max-w-md p-8 sm:p-10">
        <h1 className="text-3xl">{t("title")}</h1>
        <Suspense>
          <ConfirmSubscriptionForm />
        </Suspense>
      </div>
    </section>
  );
}
