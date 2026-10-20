import { describe, expect, it } from "vitest";
import { looksHostile, looksSpammy, sanitizeBlock, sanitizeLine } from "../../src/lib/sanitize";
import { MAX_AGE_MS, MIN_AGE_MS, issueFormToken, verifyFormToken } from "../../src/lib/form-token";
import { contactSchema } from "../../src/lib/validation";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130";
const valid = { name: "Ștefan Popescu", email: "Stefan@Example.ro", phone: "+40 766 231 632", subject: "Ofertă", message: "Aș dori o ofertă pentru 6 ferestre PVC.", consent: true as const };

describe("sanitizzazione", () => {
  it("rimuove tag, controllo, zero-width e bidi; collassa gli spazi", () => {
    expect(sanitizeLine("  Ana <script>alert(1)</script>​‮ Maria\n\r  ")).toBe("Ana alert(1) Maria");
    expect(sanitizeLine("a\r\nBcc: evil@x.com")).toBe("a Bcc: evil@x.com"); // niente a-capo: nessuna header injection
    expect(sanitizeBlock("riga1\n\n\n\n\nriga2   \u0000x")).toBe("riga1\n\nriga2 x");
  });
  it("normalizza in NFKC (lettere full-width)", () => {
    expect(sanitizeLine("ＡＢＣ")).toBe("ABC");
  });
});

describe("rilevamento ostile / spam", () => {
  it.each([
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
    "<svg/onload=alert(1)>",
    "{{constructor.constructor('x')()}}",
    "1; DROP TABLE leads; --",
    "ciao\nBcc: victim@x.com",
    "../../etc/passwd",
  ])("blocca %s", (s) => expect(looksHostile(s)).toBe(true));
  it("non blocca testo normale (anche con < > e =)", () => {
    expect(looksHostile("Servono 6 finestre, larghezza < 120 cm, U = 0,8. Grazie!")).toBe(false);
    expect(looksHostile("Vorrei un preventivo per una casa a Roman.")).toBe(false);
  });
  it("riconosce spam", () => {
    expect(looksSpammy("Buy cheap backlinks http://a.ru http://b.ru http://c.ru")).toBe(true);
    expect(looksSpammy("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toBe(true);
    expect(looksSpammy("Vă rog o ofertă pentru ferestre PVC cu geam termopan.")).toBe(false);
  });
});

describe("schema contatti", () => {
  it("normalizza e accetta un messaggio valido", () => {
    const r = contactSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("stefan@example.ro");
  });
  it("rifiuta nome con markup/URL/@, email e telefono non validi, messaggio breve, consenso mancante", () => {
    for (const bad of [
      { ...valid, name: "http://spam.ru" },
      { ...valid, name: "a@b.c" },
      { ...valid, email: "non-una-email" },
      { ...valid, email: "a@b.ro\nBcc: x@y.z" },
      { ...valid, phone: "abc" },
      { ...valid, message: "corto" },
      { ...valid, consent: false },
    ]) expect(contactSchema.safeParse(bad).success).toBe(false);
  });
  it("ripulisce il tag HTML dal nome invece di salvarlo", () => {
    const r = contactSchema.safeParse({ ...valid, name: "Ana <b>Maria</b>" });
    expect(r.success && r.data.name).toBe("Ana Maria");
  });
  it("limita la lunghezza", () => {
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(4001) }).success).toBe(false);
  });
});

describe("token di modulo firmato", () => {
  const t0 = 1_700_000_000_000;
  it("accetta un token valido una sola volta", () => {
    const tok = issueFormToken(UA, t0)!;
    expect(verifyFormToken(tok, UA, t0 + MIN_AGE_MS + 1)).toEqual({ ok: true });
    expect(verifyFormToken(tok, UA, t0 + MIN_AGE_MS + 2)).toMatchObject({ ok: false, reason: "replay" });
  });
  it("rifiuta: troppo veloce, scaduto, altro User-Agent, firma alterata, formato errato, assente", () => {
    expect(verifyFormToken(issueFormToken(UA, t0)!, UA, t0 + 500)).toMatchObject({ reason: "too_fast" });
    expect(verifyFormToken(issueFormToken(UA, t0)!, UA, t0 + MAX_AGE_MS + 10)).toMatchObject({ reason: "expired" });
    expect(verifyFormToken(issueFormToken(UA, t0)!, "altro-browser/1.0", t0 + 5000)).toMatchObject({ reason: "agent" });
    const tok = issueFormToken(UA, t0)!;
    expect(verifyFormToken(tok.slice(0, -2) + "xx", UA, t0 + 5000)).toMatchObject({ reason: "signature" });
    expect(verifyFormToken("v1.a.b", UA, t0 + 5000)).toMatchObject({ reason: "malformed" });
    expect(verifyFormToken(undefined, UA, t0 + 5000)).toMatchObject({ reason: "missing" });
    expect(verifyFormToken(issueFormToken(UA, t0 + 10_000)!, UA, t0)).toMatchObject({ ok: false }); // emesso nel futuro
  });
});
