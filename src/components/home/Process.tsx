import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export async function Process() {
  const t = await getTranslations("process");
  const steps = (["s1", "s2", "s3", "s4"] as const).map((k, i) => ({
    n: String(i + 1).padStart(2, "0"),
    title: t(`${k}Title`),
    text: t(`${k}Text`),
  }));
  return (
    <section className="section section-soft cv-auto border-y border-line">
      <div className="container-x">
        <SectionHeading index="04" eyebrow={t("eyebrow")} title={t("title")} />
        <div className="relative mt-14">
          <Reveal variant="rule" className="absolute inset-x-0 top-[0.4rem] hidden md:block" />
          <Reveal as="ol" variant="group" className="grid gap-10 md:grid-cols-4 md:gap-8">
            {steps.map((s) => (
              <li key={s.n} className="relative md:pt-9">
                <span className="absolute left-0 top-0 hidden h-3 w-3 rounded-full border-2 border-red bg-white md:block" aria-hidden />
                <span className="font-display text-sm font-bold tracking-[0.14em] text-red-deep tabular-nums">{s.n}</span>
                <h3 className="mt-3 text-xl">{s.title}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{s.text}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
