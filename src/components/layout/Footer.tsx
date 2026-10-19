import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { legalItems, navItems } from "@/lib/site";
import { getCompany } from "@/lib/company";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Footer() {
  const [t, nav, meta, c] = await Promise.all([getTranslations("footer"), getTranslations("nav"), getTranslations("meta.pages"), getCompany()]);
  const year = new Date().getFullYear();
  const ids = [c.cui && `${t("cui")}: ${c.cui}`, c.regCom && `${t("regCom")}: ${c.regCom}`].filter(Boolean).join("  ·  ");
  const hasContact = Boolean(c.address || c.phone || c.email);

  return (
    <footer className="band-dark cv-auto mt-0">
      <div className="container-x py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
          <div>
            <Logo inverse />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-inv-soft">{t("tagline")}</p>
          </div>

          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] !text-ink-inv-soft">{t("navigate")}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {navItems.map((i) => (
                <li key={i.href}>
                  <Link className="text-ink-inv transition-colors hover:text-white hover:underline hover:underline-offset-4" href={i.href}>
                    {nav(i.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] !text-ink-inv-soft">{t("legal")}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {legalItems.map((i) => (
                <li key={i.href}>
                  <Link className="text-ink-inv transition-colors hover:text-white hover:underline hover:underline-offset-4" href={i.href}>
                    {meta(`${i.key}.title`)}
                  </Link>
                </li>
              ))}
              <li>
                <a className="text-ink-inv transition-colors hover:text-white hover:underline hover:underline-offset-4" href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer">
                  {t("anpc")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] !text-ink-inv-soft">{t("contact")}</h3>
            {hasContact ? (
              <address className="mt-5 space-y-3 text-sm not-italic text-ink-inv">
                {c.address && <p>{c.address}</p>}
                {c.phone && (
                  <p>
                    <a className="hover:underline hover:underline-offset-4" href={`tel:${c.phone.replace(/[^+\d]/g, "")}`}>{c.phone}</a>
                  </p>
                )}
                {c.email && (
                  <p>
                    <a className="hover:underline hover:underline-offset-4" href={`mailto:${c.email}`}>{c.email}</a>
                  </p>
                )}
              </address>
            ) : (
              <p className="mt-5 text-sm text-ink-inv-soft">
                <Link className="text-ink-inv underline underline-offset-4 hover:text-white" href="/contact">{nav("contact")}</Link>
              </p>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[var(--line-inv)] pt-6 text-xs text-ink-inv-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {c.legalName || "Winex"}. {t("rights")}
            {ids && <span className="mt-1 block sm:ml-3 sm:mt-0 sm:inline">{ids}</span>}
          </p>
          <LanguageSwitcher className="[&_button]:text-ink-inv [&_button:hover]:bg-white/10 [&_button:hover]:text-white [&_ul]:bottom-full [&_ul]:mb-2 [&_ul]:mt-0" align="left" />
        </div>
      </div>
    </footer>
  );
}
