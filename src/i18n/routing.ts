import { defineRouting } from "next-intl/routing";

/** Lingue del sito. Belgio e Lussemburgo sono serviti da nl / fr / de (vedi `regionalAlternates`). */
export const locales = ["en", "ro", "it", "fr", "pl", "nl", "de"] as const;
export type Locale = (typeof locales)[number];

/** Nome nativo (switcher) e codice breve. */
export const localeMeta: Record<Locale, { name: string; short: string; og: string }> = {
  en: { name: "English", short: "EN", og: "en_GB" },
  ro: { name: "Română", short: "RO", og: "ro_RO" },
  it: { name: "Italiano", short: "IT", og: "it_IT" },
  fr: { name: "Français", short: "FR", og: "fr_FR" },
  pl: { name: "Polski", short: "PL", og: "pl_PL" },
  nl: { name: "Nederlands", short: "NL", og: "nl_NL" },
  de: { name: "Deutsch", short: "DE", og: "de_DE" },
};

/** hreflang regionali: stessa pagina, indicazione di mercato per i motori di ricerca. */
export const regionalAlternates: Record<string, Locale> = {
  "nl-BE": "nl",
  "fr-BE": "fr",
  "de-BE": "de",
  "fr-LU": "fr",
  "de-LU": "de",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  localeCookie: false, // nessun cookie: la lingua è nell'URL
  pathnames: {
    "/": "/",
    "/about": { en: "/about", ro: "/despre-noi", it: "/chi-siamo", fr: "/a-propos", pl: "/o-nas", nl: "/over-ons", de: "/ueber-uns" },
    "/factory": { en: "/factory", ro: "/fabrica", it: "/fabbrica", fr: "/usine", pl: "/fabryka", nl: "/fabriek", de: "/werk" },
    "/configurator": { en: "/configurator", ro: "/configurator", it: "/configuratore", fr: "/configurateur", pl: "/konfigurator", nl: "/configurator", de: "/konfigurator" },
    "/contact": { en: "/contact", ro: "/contact", it: "/contatti", fr: "/contact", pl: "/kontakt", nl: "/contact", de: "/kontakt" },
    "/privacy": { en: "/privacy-policy", ro: "/politica-confidentialitate", it: "/informativa-privacy", fr: "/politique-de-confidentialite", pl: "/polityka-prywatnosci", nl: "/privacybeleid", de: "/datenschutz" },
    "/terms": { en: "/terms-and-conditions", ro: "/termeni-si-conditii", it: "/termini-e-condizioni", fr: "/conditions-generales", pl: "/regulamin", nl: "/algemene-voorwaarden", de: "/nutzungsbedingungen" },
    "/cookies": { en: "/cookie-policy", ro: "/politica-cookies", it: "/cookie-policy", fr: "/politique-de-cookies", pl: "/polityka-cookies", nl: "/cookiebeleid", de: "/cookie-richtlinie" },
    // pagine transazionali: slug identico in tutte le lingue (i link nelle email restano semplici)
    "/unsubscribe": "/unsubscribe",
    "/confirm-subscription": "/confirm-subscription",
  },
});

export type AppPathname = keyof typeof routing.pathnames;

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (locales as readonly string[]).includes(v);
}
