import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <section className="relative isolate grid min-h-[70dvh] place-items-center overflow-hidden">
      <div className="bg-grid absolute inset-0 -z-10" aria-hidden />
      <div className="container-x py-24">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="h-display mt-6">
          {t("titleLine1")} <span className="text-red-deep">{t("titleLine2")}</span>
        </h1>
        <p className="lead mt-6 max-w-md">{t("text")}</p>
        <div className="mt-9">
          <ButtonLink href="/" arrow>{t("back")}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
