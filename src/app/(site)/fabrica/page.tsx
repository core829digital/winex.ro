import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConfiguratorCta } from "@/components/home/ConfiguratorCta";

export const metadata: Metadata = {
  title: "Fabrica",
  description: "Fabrica Winex din Roman: producția de tâmplărie PVC, aluminiu și lemn, de la profil la fereastră finită.",
  alternates: { canonical: "/fabrica" },
};

// Quando arrivano le foto: copiarle in /public/photos e valorizzare `src`.
const gallery = [
  { label: "Exteriorul fabricii", span: "md:col-span-2 md:row-span-2", ratio: "aspect-[4/3] md:aspect-auto md:min-h-[26rem]" },
  { label: "Linia de tăiere", span: "", ratio: "aspect-[4/3]" },
  { label: "Sudura profilelor", span: "", ratio: "aspect-[4/3]" },
  { label: "Asamblare", span: "", ratio: "aspect-[4/3]" },
  { label: "Control calitate", span: "", ratio: "aspect-[4/3]" },
  { label: "Depozit și livrare", span: "md:col-span-2", ratio: "aspect-[16/7]" },
];

const stages = [
  { title: "Materie primă", text: "Selecția profilelor, a geamurilor și a feroneriei." },
  { title: "Tăiere și prelucrare", text: "Debitare la milimetru, conform comenzii." },
  { title: "Asamblare", text: "Sudură, montaj feronerie și vitrare." },
  { title: "Control calitate", text: "Verificări înainte de ambalare și livrare." },
];

export default function FactoryPage() {
  return (
    <>
      <PageHero
        eyebrow="Fabrica"
        title={
          <>
            Unde prinde formă <span className="text-gradient-red">fiecare fereastră.</span>
          </>
        }
        lead="Din fabrica de la Roman pleacă tâmplăria Winex: produsă pe comandă, verificată pas cu pas, livrată gata de montaj."
      />

      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4 md:auto-rows-auto">
          {gallery.map((g, i) => (
            <Reveal key={g.label} delay={(i % 3) * 90} className={g.span}>
              <PhotoSlot alt={g.label} label={g.label} className={`${g.ratio} h-full w-full`} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Producție" title="De la profil la fereastră finită." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <GlassCard className="h-full p-7">
                  <span className="font-display text-sm font-extrabold tracking-[0.2em] text-red-deep/80">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                  <p className="mt-3 text-sm text-ink-soft">{s.text}</p>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ConfiguratorCta />
    </>
  );
}
