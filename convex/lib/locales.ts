/** Lingue supportate (devono coincidere con src/i18n/routing.ts — c'è un test di parità). */
export const LOCALES = ["en", "ro", "it", "fr", "pl", "nl", "de"] as const;
export type AppLocale = (typeof LOCALES)[number];

export function normalizeLocale(v: string | undefined | null): AppLocale {
  return (LOCALES as readonly string[]).includes(v ?? "") ? (v as AppLocale) : "en";
}
