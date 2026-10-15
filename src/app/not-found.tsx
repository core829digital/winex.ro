import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="grid min-h-[80dvh] place-items-center px-4 pt-32 text-center">
      <div>
        <p className="eyebrow">Eroare 404</p>
        <h1 className="mt-4 text-[clamp(2.4rem,6vw,4.4rem)] font-extrabold">
          Pagina nu a fost <span className="text-gradient-red">găsită.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-ink-soft">Adresa nu există sau a fost mutată.</p>
        <div className="mt-8">
          <ButtonLink href="/">Înapoi la pagina principală</ButtonLink>
        </div>
      </div>
    </section>
  );
}
