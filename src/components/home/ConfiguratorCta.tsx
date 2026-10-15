import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function ConfiguratorCta() {
  return (
    <section className="relative px-4 py-16 sm:px-6 lg:py-24">
      <Reveal className="mx-auto max-w-6xl">
        <div className="glass-strong relative overflow-hidden rounded-[2.2rem] px-7 py-14 sm:px-14 sm:py-20">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(220,36,48,0.28),transparent)]"
          />
          <div
            aria-hidden
            className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(255,122,80,0.22),transparent)]"
          />
          <div className="relative max-w-2xl">
            <p className="eyebrow">Configurator</p>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3.4rem)] font-extrabold">
              Proiectează-ți tâmplăria, în câteva minute.
            </h2>
            <p className="mt-5 text-lg text-ink-soft">
              Alege materialul, culoarea, deschiderea și geamul. Vezi rezultatul și trimite configurația
              direct către echipa noastră.
            </p>
            <div className="mt-9">
              <ButtonLink href="/configurator">
                Deschide configuratorul
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
