import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { markdownToHtml, renderEmailHtml, safeUrl, escapeHtml } from "../../convex/lib/emailTemplate";
import { verifySvix } from "../../src/lib/svix";
import { bucharestKeys, deviceOf, isBot, visitorId } from "../../src/lib/analytics";
import { contactSchema, newsletterSchema } from "../../src/lib/validation";
import { rateLimit } from "../../src/lib/rate-limit";

describe("template email", () => {
  it("escapa HTML e blocca URL pericolosi", () => {
    expect(escapeHtml(`<script>"x"&'`)).toBe("&lt;script&gt;&quot;x&quot;&amp;&#39;");
    expect(markdownToHtml("<img src=x onerror=alert(1)>")).not.toContain("<img");
    expect(markdownToHtml("[click](javascript:alert(1))")).not.toContain("javascript:");
    expect(markdownToHtml("[ok](https://winex.ro/a?b=1&c=2)")).toContain('href="https://winex.ro/a?b=1&amp;c=2"');
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html,x")).toBeNull();
    expect(safeUrl("https://winex.ro")).toBe("https://winex.ro/");
    expect(markdownToHtml("- a\n- b")).toContain("<ul");
    expect(markdownToHtml("# Titlu")).toContain("<h2");
  });
  it("include dezabonare, preheader, buton solo se URL valido", () => {
    const base = { subject: "S", body: "b", unsubscribeUrl: "https://x/dezabonare?t=1", siteUrl: "https://www.winex.ro" };
    const ok = renderEmailHtml({ ...base, preheader: "pre", ctaLabel: "Click", ctaUrl: "https://winex.ro/x" });
    expect(ok).toContain("https://x/dezabonare?t=1");
    expect(ok).toContain(">Click<");
    expect(renderEmailHtml({ ...base, ctaLabel: "Click", ctaUrl: "javascript:1" })).not.toContain(">Click<");
    expect(renderEmailHtml({ ...base, subject: "<b>x</b>" })).toContain("&lt;b&gt;x&lt;/b&gt;");
  });
});

describe("firma webhook Resend (Svix)", () => {
  const secret = "whsec_" + Buffer.from("super-secret-key-1234567890").toString("base64");
  const body = JSON.stringify({ type: "email.opened", data: { to: ["a@b.ro"] } });
  const sign = (id: string, ts: string, b: string) =>
    "v1," + createHmac("sha256", Buffer.from(secret.replace("whsec_", ""), "base64")).update(`${id}.${ts}.${b}`).digest("base64");
  const now = Date.now();
  const ts = String(Math.floor(now / 1000));
  const h = (sig: string, id = "msg_1", t = ts) => new Headers({ "svix-id": id, "svix-timestamp": t, "svix-signature": sig });

  it("accetta firma valida (anche tra più firme) e rifiuta manomissioni/replay", () => {
    expect(verifySvix(body, h(sign("msg_1", ts, body)), secret, now)).toBe(true);
    expect(verifySvix(body, h("v1,AAAA " + sign("msg_1", ts, body)), secret, now)).toBe(true);
    expect(verifySvix(body + " ", h(sign("msg_1", ts, body)), secret, now)).toBe(false);
    expect(verifySvix(body, h("v1,AAAA"), secret, now)).toBe(false);
    expect(verifySvix(body, h(sign("msg_1", ts, body), "msg_2"), secret, now)).toBe(false);
    const old = String(Math.floor(now / 1000) - 3600);
    expect(verifySvix(body, h(sign("msg_1", old, body), "msg_1", old), secret, now)).toBe(false);
    expect(verifySvix(body, new Headers(), secret, now)).toBe(false);
  });
});

describe("analytics helper", () => {
  it("riconosce bot e dispositivi", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("HeadlessChrome/120")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1")).toBe(false);
    expect(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("mobile");
    expect(deviceOf("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe("tablet");
    expect(deviceOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120")).toBe("desktop");
  });
  it("giorno/ora in Europe/Bucharest (DST incluso)", () => {
    expect(bucharestKeys(new Date("2026-07-01T21:30:00Z"))).toEqual({ day: "2026-07-02", hour: "00" }); // UTC+3 estate
    expect(bucharestKeys(new Date("2026-01-15T22:30:00Z"))).toEqual({ day: "2026-01-16", hour: "00" }); // UTC+2 inverno
  });
  it("ID visitatore: stabile nel giorno, cambia con giorno/IP/UA, non contiene l'IP", () => {
    const a = visitorId("1.2.3.4", "UA", "2026-10-15", "salt");
    expect(a).toBe(visitorId("1.2.3.4", "UA", "2026-10-15", "salt"));
    expect(a).not.toBe(visitorId("1.2.3.4", "UA", "2026-10-16", "salt"));
    expect(a).not.toBe(visitorId("1.2.3.5", "UA", "2026-10-15", "salt"));
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(a).not.toContain("1.2.3.4");
  });
});

describe("validazione form", () => {
  it("contatto: richiede consenso, email valida, honeypot vuoto", () => {
    const ok = { name: "Ana", email: "ana@x.ro", message: "mesaj suficient", consent: true };
    expect(contactSchema.safeParse(ok).success).toBe(true);
    expect(contactSchema.safeParse({ ...ok, consent: false }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, email: "nope" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, website: "http://spam" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, phone: "abc" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, message: "x".repeat(4001) }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "a@b.ro", consent: true }).success).toBe(true);
    expect(newsletterSchema.safeParse({ email: "a@b.ro", consent: false }).success).toBe(false);
  });
  it("rate limit a finestra scorrevole", () => {
    const k = "t" + Math.random();
    expect([1, 2, 3].map(() => rateLimit(k, 3, 1000))).toEqual([true, true, true]);
    expect(rateLimit(k, 3, 1000)).toBe(false);
  });
});
