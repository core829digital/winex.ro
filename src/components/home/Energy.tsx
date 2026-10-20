import { getTranslations } from "next-intl/server";
import { Flame, Layers, ShieldCheck, Volume2 } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HeroDiagram } from "./HeroDiagram";

export async function Energy() {
  const [t, h] = await Promise.all([getTranslations("energy"), getTranslations("hero")]);
  const items = [
    { icon: Layers, title: t("chambersTitle"), text: t("chambersText") },
    { icon: Flame, title: t("heatTitle"), text: t("heatText") },
    { icon: Volume2, title: t("acousticTitle"), text: t("acousticText") },
    { icon: ShieldCheck, title: t("airtightTitle"), text: t("airtightText") },
  ];
  return (
    <section className="section section-soft cv-auto border-y border-line">
      <div className="container-x grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading index="02" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        </div>
        <div>
          <Reveal variant="group" className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
            {items.map((it) => (
              <div key={it.title} className="border-t border-[var(--line-strong)] py-8">
                <it.icon size={26} strokeWidth={1.5} className="text-red" aria-hidden />
                <h3 className="mt-5 text-lg">{it.title}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-soft">{it.text}</p>
              </div>
            ))}
          </Reveal>
          <Reveal delay={200}>
            <p className="border-t border-[var(--line-strong)] pt-5 text-xs leading-relaxed text-ink-mute">{t("note")}</p>
          </Reveal>
        </div>
        <Reveal className="mx-auto w-full max-w-3xl lg:col-span-2">
          <HeroDiagram
            label={h("diagramLabel")}
            interior={h("interior")}
            exterior={h("exterior")}
            items={[
              { title: h("item1Title"), text: h("item1Text") },
              { title: h("item2Title"), text: h("item2Text") },
              { title: h("item3Title"), text: h("item3Text") },
            ]}
          />
        </Reveal>
      </div>
    </section>
  );
}
