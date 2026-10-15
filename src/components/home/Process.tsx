import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";

const steps = [
  { n: "01", title: "Consultanță", text: "Stabilim nevoile proiectului: dimensiuni, material, performanță, buget." },
  { n: "02", title: "Configurare", text: "Alegi profilul, culoarea, geamul și accesoriile în configuratorul online." },
  { n: "03", title: "Producție", text: "Tâmplăria este fabricată la Roman, pe comandă, cu control pe fiecare etapă." },
  { n: "04", title: "Montaj", text: "Livrare și montaj profesionist, pentru ca performanța să ajungă și în clădire." },
];

export function Process() {
  return (
    <section className="relative px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Cum lucrăm" title="De la idee la fereastră montată." align="center" />
        <ol className="mt-14 grid gap-5 md:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 100} className="list-none">
              <GlassCard className="h-full p-7">
                <span className="font-display text-5xl font-extrabold text-gradient-red">{s.n}</span>
                <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                <p className="mt-3 text-sm text-ink-soft">{s.text}</p>
              </GlassCard>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
