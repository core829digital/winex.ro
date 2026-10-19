import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import type { AppPathname, Locale } from "@/i18n/routing";
import { getCompany } from "@/lib/company";
import { site } from "@/lib/site";
import { PageHero } from "@/components/ui/PageHero";

type Block = { p?: string; ul?: string[] };
type Section = { title: string; blocks: Block[] };

/** Inline sicuro: **grassetto** e [testo](https://… | internal:/percorso). Nessun HTML grezzo. */
function inline(src: string, vars: Record<string, string>): ReactNode[] {
  const text = src.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean).map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i} className="font-semibold text-ink">{bold[1]}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const cls = "font-semibold text-red-deep underline underline-offset-2 hover:text-red";
      if (href.startsWith("internal:")) return <Link key={i} href={href.slice(9) as AppPathname} className={cls}>{label}</Link>;
      if (/^https:\/\//.test(href)) return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a>;
      return <span key={i}>{label}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

/** Pagina legale: contenuto da messages (sezioni strutturate), dati societari dall'admin, nessun segnaposto visibile. */
export async function LegalPage({ ns }: { ns: "privacy" | "terms" | "cookies" }) {
  const locale = (await getLocale()) as Locale;
  const [t, l, meta, company] = await Promise.all([getTranslations(ns), getTranslations("legal"), getTranslations(`meta.pages.${ns}`), getCompany()]);

  const identity = [
    company.legalName || site.name,
    company.cui && l("idCui", { v: company.cui }),
    company.regCom && l("idRegCom", { v: company.regCom }),
    company.address && l("idAddress", { v: company.address }),
    company.email && l("idEmail", { v: company.email }),
    company.phone && l("idPhone", { v: company.phone }),
  ]
    .filter(Boolean)
    .join(", ");
  const contactUrl = `${site.url.replace(/\/$/, "")}${getPathname({ locale, href: "/contact" })}`;
  const vars = { identity, email: company.email || contactUrl, domain: site.domain };

  const sections = t.raw("sections") as Section[];
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(site.legalUpdated));

  return (
    <>
      <PageHero eyebrow={l("updated", { date })} line1={meta("title")} />
      <section className="section !pt-12">
        <div className="container-x">
          <article className="mx-auto max-w-3xl">
            {locale !== "ro" && (
              <p className="mb-10 rounded-[var(--r-card)] border border-line bg-bg-soft px-5 py-4 text-sm leading-relaxed text-ink-soft">{l("translationNotice")}</p>
            )}
            {sections.map((s) => (
              <div key={s.title} className="border-t border-line py-8 first:border-t-0 first:pt-0">
                <h2 className="text-xl sm:text-2xl">{inline(s.title, vars)}</h2>
                <div className="mt-4 space-y-4 text-[0.9375rem] leading-[1.75] text-ink-soft">
                  {s.blocks.map((b, i) =>
                    b.ul ? (
                      <ul key={i} className="list-disc space-y-3 pl-5 marker:text-red">
                        {b.ul.map((li) => <li key={li}>{inline(li, vars)}</li>)}
                      </ul>
                    ) : (
                      <p key={i}>{inline(b.p ?? "", vars)}</p>
                    ),
                  )}
                </div>
              </div>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
