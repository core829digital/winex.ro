import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { Reveal } from "@/components/ui/Reveal";

export function NewsletterSection() {
  return (
    <section className="relative px-4 py-16 sm:px-6 lg:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Newsletter</p>
        <h2 className="mt-4 text-[clamp(1.8rem,3.6vw,2.8rem)] font-extrabold">Rămâi la curent cu Winex.</h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          Noutăți despre produse, proiecte și oferte. Fără spam, te poți dezabona oricând.
        </p>
        <div className="mx-auto mt-8 max-w-lg">
          <NewsletterForm />
        </div>
      </Reveal>
    </section>
  );
}
