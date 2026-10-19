import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPathname } from "./navigation";
import { localeMeta, regionalAlternates, routing, type AppPathname, type Locale } from "./routing";
import { site } from "@/lib/site";

const abs = (path: string) => `${site.url.replace(/\/$/, "")}${path === "/" ? "" : path}`;

/** canonical + hreflang (lingue, varianti regionali BE/LU e x-default). */
export function alternatesFor(locale: Locale, pathname: AppPathname) {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = abs(getPathname({ locale: l, href: pathname }));
  for (const [tag, l] of Object.entries(regionalAlternates)) languages[tag] = languages[l];
  languages["x-default"] = languages[routing.defaultLocale];
  return { canonical: abs(getPathname({ locale, href: pathname })), languages };
}

type PageKey = "about" | "factory" | "configurator" | "contact" | "privacy" | "terms" | "cookies" | "unsubscribe" | "confirm";

/** Metadata di una pagina interna, tradotti nella lingua richiesta. */
export async function pageMetadata(locale: Locale, pathname: AppPathname, key: PageKey, opts: { index?: boolean } = {}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `meta.pages.${key}` });
  const alternates = alternatesFor(locale, pathname);
  return {
    title: t("title"),
    description: t("description"),
    alternates,
    openGraph: { title: t("title"), description: t("description"), url: alternates.canonical, locale: localeMeta[locale].og, siteName: site.name, type: "website" },
    ...(opts.index === false ? { robots: { index: false, follow: false } } : {}),
  };
}
