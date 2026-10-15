import { Flame, Layers, ShieldCheck, Volume2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const items = [
  { icon: Layers, title: "Profile multicameră", text: "Camerele de aer din profil încetinesc trecerea căldurii dintre interior și exterior." },
  { icon: Flame, title: "Căldura rămâne în casă", text: "Mai puțină energie pierdută iarna, mai puțină căldură intrată vara." },
  { icon: Volume2, title: "Confort acustic", text: "Geamuri și etanșări care atenuează zgomotul din exterior." },
  { icon: ShieldCheck, title: "Etanșeitate și siguranță", text: "Garnituri continue și feronerie de calitate pentru o închidere precisă." },
];

export function Energy() {
  return (
    <section className="relative px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto grid max-w-6xl items-start gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-32">
          <SectionHeading
            eyebrow="Energie"
            title={
              <>
                Fiecare grad păstrat <span className="text-gradient-red">contează.</span>
              </>
            }
            lead="Tâmplăria bună nu se vede doar în design: se vede în factura de energie și în confortul de zi cu zi."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 90}>
              <GlassCard className="h-full p-7">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red text-white shadow-[0_10px_24px_-10px_rgba(220,36,48,0.7)]">
                  <it.icon size={22} />
                </span>
                <h3 className="mt-6 text-xl font-bold">{it.title}</h3>
                <p className="mt-3 text-sm text-ink-soft">{it.text}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
