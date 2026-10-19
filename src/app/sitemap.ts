import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { regionalAlternates, routing, type AppPathname } from "@/i18n/routing";
import { site } from "@/lib/site";

const PAGES: AppPathname[] = ["/", "/about", "/factory", "/configurator", "/contact", "/privacy", "/terms", "/cookies"];
const abs = (path: string) => `${site.url.replace(/\/$/, "")}${path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  for (const href of PAGES) {
    const languages: Record<string, string> = {};
    for (const l of routing.locales) languages[l] = abs(getPathname({ locale: l, href }));
    for (const [tag, l] of Object.entries(regionalAlternates)) languages[tag] = languages[l];
    languages["x-default"] = languages[routing.defaultLocale];
    for (const l of routing.locales) {
      out.push({
        url: abs(getPathname({ locale: l, href })),
        changeFrequency: href === "/" ? "weekly" : "monthly",
        priority: href === "/" ? 1 : href === "/configurator" || href === "/contact" ? 0.8 : 0.6,
        alternates: { languages },
      });
    }
  }
  return out;
}
