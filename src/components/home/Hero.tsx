import { getTranslations } from "next-intl/server";
import { Factory, Layers, SlidersHorizontal, Wrench } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { HeroWindow } from "./HeroWindow";

export async function Hero() {
  const [t, nav] = await Promise.all([getTranslations("hero"), getTranslations("nav")]);
  const trust = [
    { icon: Factory, text: t("trust1") },
    { icon: Layers, text: t("trust2") },
    { icon: SlidersHorizontal, text: t("trust3") },
    { icon: Wrench, text: t("trust4") },
  ];

  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      <div className="bg-grid absolute inset-0 -z-10" aria-hidden />
      <div className="container-x grid items-center gap-12 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14 lg:pb-24 lg:pt-24">
        <div>
          <p className="eyebrow rise">{t("eyebrow")}</p>
          <h1 className="h-display mt-6">
            <span className="line-mask"><span style={{ "--d": "100ms" } as React.CSSProperties}>{t("titleLine1")}</span></span>
            <span className="line-mask"><span className="text-red-deep" style={{ "--d": "230ms" } as React.CSSProperties}>{t("titleLine2")}</span></span>
          </h1>
          <p className="lead rise mt-7 max-w-xl" style={{ "--d": "420ms" } as React.CSSProperties}>
            {t("lead")}
          </p>
          <div className="rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ "--d": "560ms" } as React.CSSProperties}>
            <ButtonLink href="/contact" arrow>{nav("contact")}</ButtonLink>
            <ButtonLink href="/about" variant="outline">{nav("about")}</ButtonLink>
          </div>
        </div>

        <div className="rise" style={{ "--d": "300ms" } as React.CSSProperties}>
          <div className="surface relative overflow-hidden shadow-[var(--shadow-md)]">
            <HeroWindow label={t("windowLabel")} />
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-white/70">
        <ul className="container-x grid grid-cols-2 gap-y-6 py-7 lg:grid-cols-4">
          {trust.map((it, i) => (
            <li key={it.text} className="fade-in flex items-center gap-3.5 pr-4 lg:border-r lg:border-line lg:last:border-r-0 lg:[&:not(:first-child)]:pl-8" style={{ "--d": `${900 + i * 110}ms` } as React.CSSProperties}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-btn)] border border-line bg-white text-red">
                <it.icon size={19} strokeWidth={1.6} aria-hidden />
              </span>
              <span className="text-sm font-semibold leading-snug text-ink">{it.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
