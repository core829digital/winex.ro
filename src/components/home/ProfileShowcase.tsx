import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProfileDiagram } from "./ProfileDiagram";

/** Foto ufficiale del profilo (PNG trasparente → WebP con `npm run images`). Se manca, si mostra lo spaccato illustrativo. */
const PHOTO = "/photos/profiles/ideal-4000.webp";
const hasPhoto = existsSync(join(process.cwd(), "public", PHOTO));

/** Sistema di profili aluplast IDEAL 4000: spaccato (o foto) + dati tecnici dalla documentazione del sistema. */
export async function ProfileShowcase() {
  const [t, h, locale] = await Promise.all([getTranslations("profile"), getTranslations("hero"), getLocale()]);
  const num = (v: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: 1 }).format(v);
  const specs = [
    { label: t("depth"), value: "70 mm" },
    { label: t("chambers"), value: "5" },
    { label: t("uf"), value: `Uf ${num(1.3)}–${num(1.4)} W/m²K` },
    { label: t("seals"), value: t("sealsV") },
    { label: t("steel"), value: t("steelV") },
  ];

  return (
    <section id="profile" className="section section-soft cv-auto border-y border-line">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <figure className="surface overflow-hidden shadow-[var(--shadow-md)]">
            {hasPhoto ? (
              <div className="relative aspect-[580/512] bg-white">
                <Image src={PHOTO} alt={t("photoAlt")} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain p-6" />
              </div>
            ) : (
              <ProfileDiagram label={t("diagramLabel")} interior={h("interior")} exterior={h("exterior")} depth="70 mm" />
            )}
          </figure>
        </Reveal>

        <div className="order-1 lg:order-2">
          <SectionHeading index="02" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
          <Reveal as="ol" variant="group" className="mt-10 divide-y divide-line border-y border-line">
            {specs.map((s, i) => (
              <li key={s.label} className="flex items-center gap-4 py-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red text-xs font-bold text-white">{i + 1}</span>
                <span className="flex-1 text-[0.9375rem] text-ink-soft">{s.label}</span>
                <span className="font-display text-[0.9375rem] font-bold tabular-nums text-ink">{s.value}</span>
              </li>
            ))}
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-5 text-xs leading-relaxed text-ink-mute">{t("note")}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
