import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const KEYS = ["pvc", "alu", "timber"] as const;

export async function Materials() {
  const t = await getTranslations("materials");
  return (
    <section id="materials" className="section cv-auto">
      <div className="container-x">
        <SectionHeading index="01" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <Reveal variant="group" className="mt-14 grid gap-5 md:grid-cols-3">
          {KEYS.map((k) => (
            <article key={k} className="surface accent-bar flex flex-col p-8">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-mute">{t(`${k}.label`)}</p>
              <h3 className="mt-4 text-[1.75rem]">{t(`${k}.title`)}</h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">{t(`${k}.text`)}</p>
              <ul className="mt-7 space-y-3 border-t border-line pt-6 text-sm font-medium text-ink">
                {(["p1", "p2", "p3"] as const).map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <Check size={16} strokeWidth={2.4} className="shrink-0 text-red" aria-hidden />
                    {t(`${k}.${p}`)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
