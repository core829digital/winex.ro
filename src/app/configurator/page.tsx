import type { Metadata } from "next";
import { Ruler, Palette, PanelTop, Send } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/forms/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Configurator",
  description: "Configurează online ferestre și uși Winex: material, culoare, deschidere și geam.",
  alternates: { canonical: "/configurator" },
};

const steps = [
  { icon: PanelTop, text: "Alege tipul și materialul" },
  { icon: Ruler, text: "Setează dimensiunile" },
  { icon: Palette, text: "Culoare, geam, accesorii" },
  { icon: Send, text: "Trimite configurația" },
];

/** Accetta solo URL https (difesa contro valori d'ambiente errati). */
function safeUrl(u: string) {
  try {
    const url = new URL(u);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function ConfiguratorPage() {
  const src = site.oneSpecUrl ? safeUrl(site.oneSpecUrl) : null;

  return (
    <>
      <PageHero
        eyebrow="Configurator"
        title={
          <>
            Proiectează-ți <span className="text-gradient-red">tâmplăria.</span>
          </>
        }
        lead="Configurează ferestrele și ușile potrivite proiectului tău și trimite-ne cererea de ofertă."
      />

      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <ul className="mb-6 grid gap-3 sm:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.text} className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-soft text-red-deep">
                  <s.icon size={18} />
                </span>
                <span>
                  <span className="mr-1.5 text-red-deep">{i + 1}.</span>
                  {s.text}
                </span>
              </li>
            ))}
          </ul>

          {src ? (
            <div className="glass-strong overflow-hidden rounded-[2rem] p-2 sm:p-3">
              <iframe
                src={src}
                title="Configurator Winex — OneSpec"
                loading="lazy"
                allow="fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                className="h-[78vh] min-h-[560px] w-full rounded-[1.5rem] bg-white"
              />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Reveal>
                <GlassCard strong interactive={false} className="relative h-full overflow-hidden p-8 sm:p-10">
                  <div
                    aria-hidden
                    className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(220,36,48,0.25),transparent)] blur-2xl"
                  />
                  <p className="eyebrow relative">În curând</p>
                  <h2 className="relative mt-4 text-3xl font-extrabold">Configuratorul online se pregătește.</h2>
                  <p className="relative mt-4 text-ink-soft">
                    Integrarea cu OneSpec va fi activată în curând. Până atunci, descrie-ne proiectul și
                    îți pregătim o ofertă personalizată.
                  </p>
                  {/* Integrazione: impostare NEXT_PUBLIC_ONESPEC_URL e questo blocco viene sostituito dall'iframe. */}
                </GlassCard>
              </Reveal>
              <Reveal delay={100}>
                <GlassCard strong interactive={false} className="p-7 sm:p-9">
                  <h2 className="text-2xl font-extrabold">Cere o ofertă</h2>
                  <div className="mt-7">
                    <ContactForm source="configurator" defaultMessage="Doresc o ofertă pentru: " />
                  </div>
                </GlassCard>
              </Reveal>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
