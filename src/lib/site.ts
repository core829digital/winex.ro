/**
 * Configurazione centrale del sito (valori non traducibili).
 * I dati societari ufficiali si inseriscono dall'admin («Conținut site») e hanno la precedenza su questi default:
 * i campi vuoti non vengono mostrati sul sito pubblico.
 */
export const site = {
  name: "Winex",
  domain: "winex.ro",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.winex.ro",
  /** Data dell'ultima revisione dei testi legali (mostrata nelle pagine legali). */
  legalUpdated: "2026-10-19",
  country: "RO",
  company: {
    legalName: "WINEX ADVANCE S.R.L.",
    cui: "RO43676104", // ANAF: CUI 43676104, plătitor de TVA
    regCom: "J27/149/2021", // ONRC Neamț, înregistrat 04.02.2021
    address: "Str. Mihai Eminescu, Bl. 10, Sc. C, Et. 3, Ap. 56, Roman, jud. Neamț, România",
    phone: "+40 766 231 632",
    email: "office@winex.ro",
    hours: "",
  },
  social: { facebook: "", instagram: "", linkedin: "" },
} as const;

/** Configuratore OneSpec (embed ufficiale). L'ID pubblico può essere sovrascritto da env. */
const oneSpecId = process.env.NEXT_PUBLIC_ONESPEC_ID || "fwj8VMz94Z";
export const oneSpec = {
  origin: "https://platform.onespec.eu",
  publicId: oneSpecId,
  embedUrl: `https://platform.onespec.eu/w/${oneSpecId}`,
  pageUrl: `https://platform.onespec.eu/c/${oneSpecId}`,
} as const;

/** Voci di navigazione principali (chiavi interne delle pathnames localizzate). */
export const navItems = [
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export const legalItems = [
  { href: "/privacy", key: "privacy" },
  { href: "/terms", key: "terms" },
  { href: "/cookies", key: "cookies" },
] as const;
