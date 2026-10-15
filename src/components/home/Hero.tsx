import { ArrowRight, ChevronDown } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { HeroScene } from "./HeroScene";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-20 pt-32 sm:px-6 sm:pt-40 lg:pb-28">
      <div className="aurora" aria-hidden>
        <i />
        <i />
        <i />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div>
          <p
            className="rise glass inline-flex items-center gap-2.5 rounded-full py-1.5 pl-2 pr-4 text-xs font-semibold text-ink-soft"
            style={{ "--d": "0ms" } as React.CSSProperties}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-red">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            Fabrică de tâmplărie · Roman, România
          </p>

          <h1
            className="rise mt-7 text-[clamp(2.6rem,4.8vw,4.3rem)] font-extrabold"
            style={{ "--d": "120ms" } as React.CSSProperties}
          >
            Ferestre care țin
            <br />
            <span className="text-gradient-red">energia acasă.</span>
          </h1>

          <p
            className="rise mt-7 max-w-xl text-lg text-ink-soft sm:text-xl"
            style={{ "--d": "260ms" } as React.CSSProperties}
          >
            Fabricăm tâmplărie din PVC, aluminiu și lemn la Roman — gândită pentru izolare, durabilitate
            și un design care se vede.
          </p>

          <div
            className="rise mt-10 flex flex-col gap-3 sm:flex-row"
            style={{ "--d": "400ms" } as React.CSSProperties}
          >
            <ButtonLink href="/configurator">
              Configurează tâmplăria
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </ButtonLink>
            <ButtonLink href="/fabrica" variant="glass">
              Vezi fabrica
            </ButtonLink>
          </div>

          <ul
            className="rise mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-ink-soft"
            style={{ "--d": "540ms" } as React.CSSProperties}
          >
            {["Producție proprie", "PVC · Aluminiu · Lemn", "Montaj profesionist"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="rise" style={{ "--d": "300ms" } as React.CSSProperties}>
          <HeroScene />
        </div>
      </div>

      <a
        href="#materiale"
        aria-label="Derulează la secțiunea următoare"
        className="rise absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-ink-mute transition hover:text-red-deep lg:block"
        style={{ "--d": "900ms" } as React.CSSProperties}
      >
        <ChevronDown className="animate-bounce" />
      </a>
    </section>
  );
}
