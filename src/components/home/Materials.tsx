import { Check } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const materials = [
  {
    key: "PVC",
    title: "PVC",
    text: "Alegerea echilibrată pentru locuințe: izolare termică și fonică, întreținere minimă și un raport excelent între performanță și investiție.",
    points: ["Profile multicameră", "Întreținere minimă", "Eficiență energetică"],
    glow: "rgba(220,36,48,0.20)",
  },
  {
    key: "ALU",
    title: "Aluminiu",
    text: "Profile suple și rezistente pentru suprafețe vitrate mari, linii arhitecturale curate și clădiri comerciale.",
    points: ["Linii subțiri, lumină multă", "Rezistență structurală", "Finisaje durabile"],
    glow: "rgba(37,40,45,0.10)",
  },
  {
    key: "LEMN",
    title: "Lemn",
    text: "Căldura materialului natural, cu precizia producției industriale — pentru proiecte în care aspectul contează la fel de mult ca performanța.",
    points: ["Estetică naturală", "Personalizare", "Pentru case și restaurări"],
    glow: "rgba(255,122,80,0.20)",
  },
];

export function Materials() {
  return (
    <section id="materiale" className="cv-auto relative px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Materiale"
          title="Trei materiale. O singură exigență."
          lead="Aceeași precizie de fabrică, indiferent de material — alegi ce se potrivește proiectului tău."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {materials.map((m, i) => (
            <Reveal key={m.key} delay={i * 110}>
              <GlassCard className="group relative h-full overflow-hidden p-7 sm:p-8">
                <div
                  aria-hidden
                  className="absolute -right-20 -top-20 h-64 w-64 rounded-full transition-transform duration-700 group-hover:scale-125"
                  style={{ background: `radial-gradient(closest-side, ${m.glow}, transparent)` }}
                />
                <p className="font-display text-sm font-extrabold tracking-[0.2em] text-red-deep/80">{m.key}</p>
                <h3 className="mt-3 text-3xl font-extrabold">{m.title}</h3>
                <p className="mt-4 text-ink-soft">{m.text}</p>
                <ul className="mt-6 space-y-2.5 text-sm font-medium text-ink">
                  {m.points.map((p) => (
                    <li key={p} className="flex items-center gap-2.5">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-red-soft text-red-deep">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
