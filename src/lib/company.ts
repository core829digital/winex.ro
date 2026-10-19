import "server-only";
import { unstable_cache } from "next/cache";
import { site } from "./site";
import { getServerSettings } from "./server";

export type Company = {
  legalName: string;
  cui: string;
  regCom: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  facebook: string;
  instagram: string;
  linkedin: string;
};

const defaults: Company = {
  legalName: site.company.legalName,
  cui: site.company.cui,
  regCom: site.company.regCom,
  address: site.company.address,
  phone: site.company.phone,
  email: site.company.email,
  hours: site.company.hours,
  facebook: site.social.facebook,
  instagram: site.social.instagram,
  linkedin: site.social.linkedin,
};

/** Dati societari: modificabili da admin (Convex), con fallback ai default in site.ts. I campi vuoti non vengono mostrati. Cache 60s. */
export const getCompany = unstable_cache(
  async (): Promise<Company> => {
    const { company } = await getServerSettings();
    if (!company || typeof company !== "object") return defaults;
    const c = company as Partial<Company>;
    const pick = (k: keyof Company) => (typeof c[k] === "string" && c[k]!.trim() ? c[k]!.trim() : defaults[k]);
    return Object.fromEntries((Object.keys(defaults) as (keyof Company)[]).map((k) => [k, pick(k)])) as Company;
  },
  ["winex-company"],
  { revalidate: 60, tags: ["company"] },
);
