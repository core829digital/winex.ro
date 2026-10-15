// @vitest-environment edge-runtime
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../convex/_generated/api";
import { SECRET, asUser, makeT, type T } from "./helpers";

type Sent = { url: string; headers: Record<string, string>; body: Record<string, any>[] };
let calls: Sent[] = [];
let failWith: number | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  calls = [];
  failWith = null;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string) });
      return failWith ? new Response("boom", { status: failWith }) : new Response("{}", { status: 200 });
    }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function seedSubs(t: T, active: number) {
  await t.run(async (ctx) => {
    for (let i = 0; i < active; i++)
      await ctx.db.insert("subscribers", { email: `u${i}@x.ro`, consent: true, source: "t", status: "subscribed", unsubToken: `tok${String(i).padStart(29, "0")}`, subscribedAt: Date.now() });
    await ctx.db.insert("subscribers", { email: "gone@x.ro", consent: true, source: "t", status: "unsubscribed", unsubToken: "g".repeat(32), subscribedAt: Date.now() });
    await ctx.db.insert("subscribers", { email: "bounced@x.ro", consent: true, source: "t", status: "suppressed", unsubToken: "b".repeat(32), subscribedAt: Date.now() });
  });
}

const draft = { name: "Toamnă", subject: "Ofertă de toamnă", preheader: "Vezi ofertele", body: "Salut!\n\n**Ofertă** [aici](https://winex.ro)", ctaLabel: "Configurează", ctaUrl: "https://www.winex.ro/configurator" };

describe("campagne email", () => {
  it("salva bozza, valida link, blocca modifiche dopo l'invio", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    await expect(client.mutation(api.campaigns.save, { ...draft, ctaUrl: "javascript:alert(1)" })).rejects.toThrow(/INVALID_CTA_URL/);
    const id = await client.mutation(api.campaigns.save, draft);
    const c = await client.query(api.campaigns.get, { id });
    expect(c).toMatchObject({ status: "draft", createdBy: "stefan@core829.ro", stats: { sent: 0, opened: 0 } });
    await client.mutation(api.campaigns.save, { id, ...draft, subject: "Nou subiect" });
    expect((await client.query(api.campaigns.get, { id }))?.subject).toBe("Nou subiect");

    await seedSubs(t, 1);
    await client.mutation(api.campaigns.send, { id });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    await expect(client.mutation(api.campaigns.save, { id, ...draft })).rejects.toThrow(/LOCKED/);
    await client.mutation(api.campaigns.remove, { id }); // inviata: eliminabile (non sending/scheduled)
    expect(await client.query(api.campaigns.get, { id })).toBeNull();
  });

  it("invio: solo iscritti attivi, header di disiscrizione, tag campagna, stato e contatori", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    await seedSubs(t, 3);
    const id = await client.mutation(api.campaigns.save, draft);
    await client.mutation(api.campaigns.send, { id });
    expect((await client.query(api.campaigns.get, { id }))?.status).toBe("scheduled");
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.resend.com/emails/batch");
    expect(calls[0].headers.Authorization).toBe("Bearer re_test");
    expect(calls[0].headers["Idempotency-Key"]).toContain(String(id));
    const msgs = calls[0].body;
    expect(msgs.map((m) => m.to[0]).sort()).toEqual(["u0@x.ro", "u1@x.ro", "u2@x.ro"]); // no dezabonat, no bounced
    for (const m of msgs) {
      expect(m.from).toBe("Winex <no-reply@winex.ro>");
      expect(m.subject).toBe("Ofertă de toamnă");
      expect(m.tags).toEqual([{ name: "campaign_id", value: String(id) }]);
      expect(m.headers["List-Unsubscribe"]).toMatch(/^<https:\/\/www\.winex\.ro\/api\/unsubscribe\?t=tok\d+>$/);
      expect(m.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
      expect(m.html).toContain("https://www.winex.ro/dezabonare?t=tok");
      expect(m.html).toContain("<strong>Ofertă</strong>");
      expect(m.text).toContain("Dezabonare:");
    }
    const done = await client.query(api.campaigns.get, { id });
    expect(done?.status).toBe("sent");
    expect(done?.stats).toMatchObject({ sent: 3, recipients: 3 });
    expect(done?.sentAt).toBeTypeOf("number");
  });

  it("paginazione: 250 destinatari → batch da 100/100/50", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    await seedSubs(t, 250);
    const id = await client.mutation(api.campaigns.save, draft);
    await client.mutation(api.campaigns.send, { id });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(calls.map((c) => c.body.length)).toEqual([100, 100, 50]);
    const all = calls.flatMap((c) => c.body.map((m) => m.to[0]));
    expect(new Set(all).size).toBe(250); // nessun duplicato
    expect((await client.query(api.campaigns.get, { id }))?.stats.sent).toBe(250);
  });

  it("errore Resend → stato failed con messaggio", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    await seedSubs(t, 2);
    const id = await client.mutation(api.campaigns.save, draft);
    failWith = 500;
    await client.mutation(api.campaigns.send, { id });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const c = await client.query(api.campaigns.get, { id });
    expect(c?.status).toBe("failed");
    expect(c?.error).toMatch(/Resend 500/);
  });

  it("programmazione: annullare impedisce l'invio del vecchio job", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    await seedSubs(t, 2);
    const id = await client.mutation(api.campaigns.save, draft);
    await client.mutation(api.campaigns.send, { id, at: Date.now() + 3_600_000 });
    expect(await client.query(api.campaigns.get, { id })).toMatchObject({ status: "scheduled" });
    await client.mutation(api.campaigns.cancelSchedule, { id });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(calls).toHaveLength(0);
    expect((await client.query(api.campaigns.get, { id }))?.status).toBe("draft");
    await expect(client.mutation(api.campaigns.cancelSchedule, { id })).rejects.toThrow(/NOT_SCHEDULED/);
  });

  it("rifiuta invio senza oggetto/corpo", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    const id = await client.mutation(api.campaigns.save, { name: "x", subject: " ", body: "ciao" });
    await expect(client.mutation(api.campaigns.send, { id })).rejects.toThrow(/EMPTY/);
  });

  it("test: solo verso admin; invia con prefisso [TEST]", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    const id = await client.mutation(api.campaigns.save, draft);
    await expect(client.mutation(api.campaigns.sendTest, { id, to: "victim@x.ro" })).rejects.toThrow(/TEST_ONLY_TO_ADMINS/);
    await client.mutation(api.campaigns.sendTest, { id });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(calls).toHaveLength(1);
    expect(calls[0].body[0]).toMatchObject({ to: ["stefan@core829.ro"], subject: "[TEST] Ofertă de toamnă" });
    expect((await client.query(api.campaigns.get, { id }))?.testNote).toBe("Test trimis la stefan@core829.ro");
  });

  it("webhook: eventi unici per destinatario, ignora id/tipi non validi", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    const id = await client.mutation(api.campaigns.save, draft);
    const ev = (type: string, email = "a@x.ro", campaignId: string = id) => t.mutation(api.campaigns.recordEvent, { secret: SECRET, campaignId, email, type });
    await ev("delivered");
    await ev("opened");
    await ev("opened"); // duplicato
    await ev("opened", "B@x.ro");
    await ev("clicked");
    await ev("bounced", "c@x.ro");
    await ev("weird");
    await ev("opened", "a@x.ro", "not-an-id");
    expect((await client.query(api.campaigns.get, { id }))?.stats).toMatchObject({ delivered: 1, opened: 2, clicked: 1, bounced: 1, complained: 0 });
  });
});
