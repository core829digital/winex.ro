import type { Metadata } from "next";
import { Gauge, Handshake, Hammer, Leaf } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { ConfiguratorCta } from "@/components/home/ConfiguratorCta";

export const metadata: Metadata = {
  title: "Despre noi",
  description: "Winex — fabrică de tâmplărie PVC, aluminiu și lemn din Roman, România.",
  alternates: { canonical: "/despre-noi" },
};

const values = [
  { icon: Gauge, title: "Precizie", text: "Fiecare element este produs pe măsură, cu toleranțe strânse și control pe parcurs." },
  { icon: Leaf, title: "Eficiență", text: "Gândim tâmplăria ca pe un sistem care economisește energie, nu doar ca pe un produs." },
  { icon: Hammer, title: "Meșteșug", text: "Tehnologie modernă și experiența oamenilor care știu să lucreze materialul." },
  { icon: Handshake, title: "Încredere", text: "Comunicare clară, termene realiste și suport înainte și după montaj." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Despre noi"
        title={
          <>
            Tâmplărie făcută la Roman, <span className="text-gradient-red">pentru case din toată țara.</span>
          </>
        }
        lead="Winex este o fabrică de tâmplărie din PVC, aluminiu și lemn. Producem local, cu atenție la detaliu și cu un singur obiectiv: ferestre și uși care funcționează bine ani la rând."
      />

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-extrabold">Povestea Winex</h2>
            <div className="mt-6 space-y-4 text-ink-soft">
              <p>
                {/* TODO: conținut oficial — istoric, anul înființării, misiune, echipă. */}
                Aici va apărea povestea companiei: cum a început, cum a crescut fabrica din Roman și ce ne
                diferențiază. Textul oficial va fi adăugat după ce primim informațiile despre companie.
              </p>
              <p>
                Lucrăm cu trei materiale — PVC, aluminiu și lemn — pentru ca fiecare proiect să primească
                soluția potrivită, nu doar pe cea disponibilă.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <PhotoSlot alt="Echipa Winex" label="Echipa" className="aspect-[4/3]" />
          </Reveal>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Valori" title="Ce ne ghidează." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 90}>
                <GlassCard className="h-full p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-soft text-red-deep">
                    <v.icon size={22} />
                  </span>
                  <h3 className="mt-6 text-xl font-bold">{v.title}</h3>
                  <p className="mt-3 text-sm text-ink-soft">{v.text}</p>
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
