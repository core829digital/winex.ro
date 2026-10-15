import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/forms/ContactForm";
import { getCompany } from "@/lib/company";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactează Winex pentru oferte de tâmplărie PVC, aluminiu și lemn. Fabrica este în Roman, România.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const c = await getCompany();
  const info = [
    { icon: MapPin, label: "Adresă", value: c.address },
    { icon: Phone, label: "Telefon", value: c.phone },
    { icon: Mail, label: "E-mail", value: c.email },
    { icon: Clock, label: "Program", value: c.hours },
  ];
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Hai să vorbim despre <span className="text-gradient-red">proiectul tău.</span>
          </>
        }
        lead="Scrie-ne sau sună-ne. Îți răspundem cu o ofertă clară și un termen realist."
      />
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <GlassCard interactive={false} className="h-full p-7 sm:p-9">
              <h2 className="text-2xl font-extrabold">Date de contact</h2>
              <ul className="mt-8 space-y-6">
                {info.map((i) => (
                  <li key={i.label} className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-soft text-red-deep">
                      <i.icon size={20} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">{i.label}</p>
                      <p className="mt-1 text-ink">{i.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </Reveal>
          <Reveal delay={100}>
            <GlassCard strong interactive={false} className="p-7 sm:p-9">
              <h2 className="text-2xl font-extrabold">Trimite-ne un mesaj</h2>
              <div className="mt-7">
                <ContactForm />
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </section>
    </>
  );
}
