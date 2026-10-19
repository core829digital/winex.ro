import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { locales, routing, regionalAlternates, localeMeta } from "../../src/i18n/routing";
import { LOCALES } from "../../convex/lib/locales";
import { parseOneSpecResize } from "../../src/lib/onespec";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
const load = (l: string): Json => JSON.parse(readFileSync(`messages/${l}.json`, "utf8"));

/** Appiattisce i messaggi in {percorso → stringa}. Gli array sono indicizzati. */
function flat(v: Json, prefix = "", out: Record<string, string> = {}) {
  if (typeof v === "string") out[prefix] = v;
  else if (Array.isArray(v)) v.forEach((x, i) => flat(x, `${prefix}[${i}]`, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) flat(x, prefix ? `${prefix}.${k}` : k, out);
  return out;
}
const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const tags = (s: string) => [...s.matchAll(/<\/?(\w+)>/g)].map((m) => m[1]).sort();
const bold = (s: string) => (s.match(/\*\*/g) ?? []).length;
const links = (s: string) => [...s.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).sort();

const base = flat(load("en"));

describe("configurazione lingue", () => {
  it("Next.js e Convex hanno esattamente le stesse lingue", () => {
    expect([...locales].sort()).toEqual([...LOCALES].sort());
  });
  it("ogni lingua ha nome, codice breve e og-locale", () => {
    for (const l of locales) expect(localeMeta[l]).toMatchObject({ name: expect.any(String), short: expect.any(String), og: expect.stringMatching(/^[a-z]{2}_[A-Z]{2}$/) });
  });
  it("ogni pathname è definito per tutte le lingue, senza slug duplicati nella stessa lingua", () => {
    const seen: Record<string, Set<string>> = {};
    for (const [key, v] of Object.entries(routing.pathnames)) {
      if (typeof v === "string") continue;
      for (const l of locales) {
        expect(v[l], `${key} / ${l}`).toMatch(/^\/[a-z0-9-]+$/);
        (seen[l] ??= new Set());
        expect(seen[l].has(v[l]), `slug duplicato ${l}${v[l]}`).toBe(false);
        seen[l].add(v[l]);
      }
    }
  });
  it("varianti regionali Belgio/Lussemburgo puntano a lingue esistenti", () => {
    expect(Object.keys(regionalAlternates).sort()).toEqual(["de-BE", "de-LU", "fr-BE", "fr-LU", "nl-BE"]);
    for (const l of Object.values(regionalAlternates)) expect(locales).toContain(l);
  });
});

describe.each(locales.filter((l) => l !== "en"))("traduzione %s", (loc) => {
  const m = flat(load(loc));
  it("ha esattamente le stesse chiavi dell'inglese", () => {
    expect(Object.keys(m).sort()).toEqual(Object.keys(base).sort());
  });
  it("nessun valore vuoto", () => {
    for (const [k, v] of Object.entries(m)) expect(v.trim().length, k).toBeGreaterThan(0);
  });
  it("stessi segnaposto {…}, tag <link> e struttura **grassetto** / link dell'originale", () => {
    for (const [k, en] of Object.entries(base)) {
      expect(vars(m[k]), `segnaposto ${k}`).toEqual(vars(en));
      expect(tags(m[k]), `tag ${k}`).toEqual(tags(en));
      expect(bold(m[k]), `grassetto ${k}`).toBe(bold(en));
      expect(links(m[k]), `link ${k}`).toEqual(links(en));
    }
  });
  it("traduce davvero: la maggior parte dei testi differisce dall'inglese", () => {
    const keys = Object.keys(base).filter((k) => base[k].length > 25);
    const same = keys.filter((k) => m[k] === base[k]).length;
    expect(same / keys.length, `${loc}: troppe stringhe identiche all'inglese`).toBeLessThan(0.08);
  });
});

describe("contenuti: nessun riferimento alla località", () => {
  it.each(locales)("%s: nessun «Roman» nei testi (la città non compare nel sito pubblico)", (loc) => {
    for (const [k, v] of Object.entries(flat(load(loc)))) expect(v, k).not.toMatch(/\bRoman\b/);
  });
  it.each(locales)("%s: nessun «Produs la Roman» / segnaposto TODO", (loc) => {
    for (const [k, v] of Object.entries(flat(load(loc)))) {
      expect(v, k).not.toMatch(/Produs la Roman|\bTODO\b|Foto în curând|coming soon/i);
    }
  });
  it("lo slogan «Direct din curtea fabricii» è presente in romeno", () => {
    const ro = flat(load("ro"));
    expect(ro["common.tagline"]).toBe("Direct din curtea fabricii");
    expect(ro["hero.titleLine2"]).toContain("direct din curtea fabricii");
  });
  it.each(locales)("%s: titolo hero e tagline sempre presenti", (loc) => {
    const m = flat(load(loc));
    expect(m["common.tagline"].length).toBeGreaterThan(8);
    expect(m["hero.titleLine2"].length).toBeGreaterThan(8);
  });
});

describe("OneSpec: auto-ridimensionamento sicuro", () => {
  const ORIGIN = "https://platform.onespec.eu";
  const ID = "fwj8VMz94Z";
  const ok = { type: "onespec:resize", publicId: ID, height: 1234 };
  it("accetta solo il messaggio atteso", () => {
    expect(parseOneSpecResize(ORIGIN, ok, ID, ORIGIN)).toBe(1234);
    expect(parseOneSpecResize(ORIGIN, { ...ok, height: 1234.6 }, ID, ORIGIN)).toBe(1235);
  });
  it("ignora origine errata, ID diverso, tipo diverso, altezza non valida e dati non oggetto", () => {
    expect(parseOneSpecResize("https://evil.com", ok, ID, ORIGIN)).toBeNull();
    expect(parseOneSpecResize("https://platform.onespec.eu.evil.com", ok, ID, ORIGIN)).toBeNull();
    expect(parseOneSpecResize("http://platform.onespec.eu", ok, ID, ORIGIN)).toBeNull();
    expect(parseOneSpecResize(ORIGIN, { ...ok, publicId: "other" }, ID, ORIGIN)).toBeNull();
    expect(parseOneSpecResize(ORIGIN, { ...ok, type: "onespec:other" }, ID, ORIGIN)).toBeNull();
    expect(parseOneSpecResize(ORIGIN, { ...ok, height: "1234" }, ID, ORIGIN)).toBeNull();
    expect(parseOneSpecResize(ORIGIN, { ...ok, height: NaN }, ID, ORIGIN)).toBeNull();
    expect(parseOneSpecResize(ORIGIN, { ...ok, height: -5 }, ID, ORIGIN)).toBeNull();
    expect(parseOneSpecResize(ORIGIN, null, ID, ORIGIN)).toBeNull();
    expect(parseOneSpecResize(ORIGIN, "onespec:resize", ID, ORIGIN)).toBeNull();
  });
  it("limita altezze assurde", () => {
    expect(parseOneSpecResize(ORIGIN, { ...ok, height: 9_999_999 }, ID, ORIGIN)).toBe(20000);
  });
});

/**
 * Posizionamento neutro: il sito NON deve dichiarare che Winex è un produttore
 * (per poter esplorare liberamente zone/canali di vendita). «Direct din curtea fabricii» resta ammesso:
 * indica da dove parte la merce, non chi la produce.
 */
describe("posizionamento neutro (nessun claim da produttore)", () => {
  const CLAIMS: Record<string, RegExp> = {
    en: /\bmanufactur(?:er|e|es|ing)\b|\bwe produce\b|\bin-house\b|\bour factory\b|\bour production\b/i,
    ro: /\bproduc[ăa]tor\b|\bproducem\b|\bfabric[ăa]m\b|\bproduc[țt]ie proprie\b|\bfabrica noastr[ăa]\b|\bproduc[țt]ia noastr[ăa]\b/i,
    it: /\bprodut(?:tore|tori)\b|\bproduciamo\b|\bfabbrichiamo\b|\bproduzione (?:interna|propria)\b|\bla nostra fabbrica\b/i,
    fr: /\bfabricants?\b|\bnous fabriquons\b|\bnous produisons\b|\bproduction (?:intégrée|interne|propre)\b|\bnotre usine\b/i,
    pl: /\bproducent\w*\b|\bprodukujemy\b|\bwytwarzamy\b|\bwłasna produkcja\b|\bnasza fabryka\b|\bnasza produkcja\b/i,
    nl: /\bproducent\b|\bfabrikant\b|\bwij produceren\b|\bwij fabriceren\b|\beigen productie\b|\bonze fabriek\b/i,
    de: /\bHersteller\b|\bwir (?:produzieren|fertigen|stellen .* her)\b|\beigene Fertigung\b|\bunser Werk\b|\bunsere Produktion\b/i,
  };
  it.each(locales)("%s: nessuna dichiarazione di produzione propria", (loc) => {
    for (const [k, v] of Object.entries(flat(load(loc)))) {
      expect(v, `${loc}:${k}`).not.toMatch(CLAIMS[loc]);
    }
  });
  it("la frase richiesta è il testo dell'hero in romeno", () => {
    expect(flat(load("ro"))["hero.lead"]).toBe("Tâmplăria noastră este gândită pentru izolare, durabilitate și un design care se vede.");
  });
  it.each(locales)("%s: il testo dell'hero (frase del cliente) è presente e tradotto", (loc) => {
    expect(flat(load(loc))["hero.lead"].length).toBeGreaterThan(30);
  });
});
