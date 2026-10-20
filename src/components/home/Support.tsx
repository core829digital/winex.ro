import { getTranslations } from "next-intl/server";
import { Layers, Headset, Workflow, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getCompany } from "@/lib/company";

/** Profili di qualità, assistenza e sistema digitale, poi invito a chiamare. Il numero arriva dai dati societari. */
export async function Support() {
  const [t, nav, c] = await Promise.all([getTranslations("support"), getTranslations("nav"), getCompany()]);
  const items = [
    { icon: Layers, title: t("p1Title"), text: t("p1Text") },
    { icon: Headset, title: t("p2Title"), text: t("p2Text") },
    { icon: Workflow, title: t("p3Title"), text: t("p3Text") },
  ];
  const tel = c.phone ? `tel:${c.phone.replace(/[^+\d]/g, "")}` : null;

  return (
    <section className="band-dark cv-auto relative isolate overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-60"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          WebkitMaskImage: "radial-gradient(ellipse 70% 100% at 85% 50%, #000, transparent)",
          maskImage: "radial-gradient(ellipse 70% 100% at 85% 50%, #000, transparent)",
        }}
      />
      <div className="absolute -right-24 top-1/2 -z-10 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full" aria-hidden style={{ background: "radial-gradient(closest-side, rgba(204,31,43,0.35), transparent)" }} />
      <div className="container-x py-20 sm:py-28">
        <SectionHeading index="04" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} inverse />

        <Reveal variant="group" className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {items.map((it) => (
            <div key={it.title} className="border-t border-[var(--line-inv)] pt-7">
              <it.icon size={28} strokeWidth={1.5} className="text-[#ff8a92]" aria-hidden />
              <h3 className="mt-5 text-xl">{it.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-inv-soft">{it.text}</p>
            </div>
          ))}
        </Reveal>

        <Reveal delay={150} className="mt-14 flex flex-col gap-5 border-t border-[var(--line-inv)] pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-white">{t("callNote")}</p>
            {c.phone && <p className="mt-1 text-sm tabular-nums text-ink-inv-soft">{c.phone}</p>}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {tel ? (
              <a
                href={tel}
                className="group inline-flex items-center justify-center gap-2.5 rounded-[var(--r-btn)] bg-red px-7 py-3.5 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-red-deep"
              >
                <Phone size={18} aria-hidden />
                {t("call")}
              </a>
            ) : null}
            <ButtonLink href="/contact" variant="light" arrow>
              {nav("contact")}
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
