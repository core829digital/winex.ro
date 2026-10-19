import { getTranslations } from "next-intl/server";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { Reveal } from "@/components/ui/Reveal";

export async function NewsletterSection() {
  const t = await getTranslations("newsletter");
  return (
    <section className="section cv-auto border-t border-line">
      <div className="container-x">
        <Reveal className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="h-section mt-5">{t("title")}</h2>
            <p className="lead mt-4">{t("text")}</p>
          </div>
          <NewsletterForm />
        </Reveal>
      </div>
    </section>
  );
}
