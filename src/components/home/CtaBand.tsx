import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export async function CtaBand() {
  const t = await getTranslations("cta");
  return (
    <section className="band-dark cv-auto relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-60" aria-hidden style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "56px 56px", WebkitMaskImage: "radial-gradient(ellipse 70% 100% at 85% 50%, #000, transparent)", maskImage: "radial-gradient(ellipse 70% 100% at 85% 50%, #000, transparent)" }} />
      <div className="absolute -right-24 top-1/2 -z-10 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full" aria-hidden style={{ background: "radial-gradient(closest-side, rgba(204,31,43,0.35), transparent)" }} />
      <div className="container-x py-20 sm:py-24">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="h-section mt-5">{t("title")}</h2>
          <p className="lead mt-5">{t("text")}</p>
          <div className="mt-9">
            <ButtonLink href="/configurator" variant="light" arrow>{t("button")}</ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
