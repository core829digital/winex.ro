/**
 * Configurazione centrale del sito.
 * I campi con "TODO" sono segnaposto: sostituire con i dati ufficiali di Winex
 * prima della messa online (compaiono anche nelle pagine legali).
 */
export const site = {
  name: "Winex",
  legalName: "TODO — Denumirea legală completă a societății (ex. S.C. WINEX S.R.L.)",
  domain: "winex.ro",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.winex.ro",
  tagline: "Tâmplărie PVC, aluminiu și lemn, produsă la Roman.",
  description:
    "Winex produce ferestre, uși și sisteme de tâmplărie din PVC, aluminiu și lemn în fabrica din Roman, România. Eficiență energetică, precizie și montaj profesionist.",
  locale: "ro_RO",
  city: "Roman",
  country: "România",
  company: {
    cui: "TODO — CUI",
    regCom: "TODO — Nr. Reg. Comerțului (J…)",
    address: "TODO — Adresa sediului / fabricii, Roman, jud. Neamț",
    phone: "TODO — telefon",
    email: "TODO — contact@winex.ro",
    hours: "TODO — program (ex. Luni–Vineri 08:00–17:00)",
  },
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
  },
  oneSpecUrl: process.env.NEXT_PUBLIC_ONESPEC_URL ?? "",
} as const;

export const nav = [
  { href: "/despre-noi", label: "Despre noi" },
  { href: "/fabrica", label: "Fabrica" },
  { href: "/configurator", label: "Configurator" },
  { href: "/contact", label: "Contact" },
] as const;

export const legalNav = [
  { href: "/politica-confidentialitate", label: "Politica de confidențialitate" },
  { href: "/termeni-si-conditii", label: "Termeni și condiții" },
  { href: "/politica-cookies", label: "Politica de cookie-uri" },
] as const;
