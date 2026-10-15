// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import { SECRET, asUser, makeT } from "./helpers";

const lead = (n: string) => ({ secret: SECRET, name: n, email: `${n}@x.ro`, message: "mesaj de test suficient", source: "contact", consent: true });

describe("messaggi (leads)", () => {
  it("ciclo completo: crea → conta nuovi → segna letto → nota → elimina con audit", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    const id = await t.mutation(api.leads.create, lead("ana"));
    await t.mutation(api.leads.create, lead("bob"));

    const c1 = await client.query(api.leads.newCount, {});
    expect(c1.count).toBe(2);
    expect(c1.latestName).toBe("bob");

    await client.mutation(api.leads.setStatus, { id, status: "read" });
    expect((await client.query(api.leads.newCount, {})).count).toBe(1);
    expect((await client.query(api.leads.list, { status: "read" })).map((l) => l.name)).toEqual(["ana"]);
    expect((await client.query(api.leads.list, {})).length).toBe(2);

    await client.mutation(api.leads.setNote, { id, note: "  sunat luni  " });
    expect((await client.query(api.leads.list, { status: "read" }))[0].note).toBe("sunat luni");
    await expect(client.mutation(api.leads.setNote, { id, note: "x".repeat(4001) })).rejects.toThrow(/NOTE_TOO_LONG/);

    await client.mutation(api.leads.remove, { id });
    expect((await client.query(api.leads.list, {})).length).toBe(1);
    const log = await client.query(api.team.overview, {});
    expect(log.log[0]).toMatchObject({ action: "lead.delete", actor: "stefan@core829.ro" });
  });
});

describe("newsletter — double opt-in", () => {
  const sub = (t: ReturnType<typeof makeT>, email: string) =>
    t.mutation(api.subscribers.subscribe, { secret: SECRET, email, source: "website", consent: true });
  const row = (t: ReturnType<typeof makeT>, email: string) =>
    t.run(async (ctx) => ctx.db.query("subscribers").withIndex("by_email", (q) => q.eq("email", email)).first());

  it("la richiesta crea un iscritto PENDING (non attivo) e chiede di inviare la conferma", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    const r = await sub(t, " Mario@X.RO ");
    expect(r.send).toBe(true);
    expect(r.confirmToken).toMatch(/^[0-9a-f]{32}$/);
    const d = await row(t, "mario@x.ro");
    expect(d).toMatchObject({ status: "pending", consent: true });
    expect(d?.unsubToken).not.toBe(r.confirmToken); // token distinti
    expect(await client.query(api.subscribers.stats, {})).toEqual({ pending: 1, subscribed: 0, unsubscribed: 0, suppressed: 0 });
    expect(await client.query(api.subscribers.activeCount, {})).toBe(0); // i pending NON ricevono campagne
    // l'admin UI non vede mai i token
    const [item] = await client.query(api.subscribers.list, {});
    expect(item).not.toHaveProperty("unsubToken");
    expect(item).not.toHaveProperty("confirmToken");
  });

  it("senza consenso nessuna iscrizione", async () => {
    const t = makeT();
    await expect(t.mutation(api.subscribers.subscribe, { secret: SECRET, email: "a@b.ro", source: "w", consent: false })).rejects.toThrow(/CONSENT_REQUIRED/);
    expect(await row(t, "a@b.ro")).toBeNull();
  });

  it("conferma: pending → subscribed, token monouso, restituisce i dati per la welcome email", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    const { confirmToken } = await sub(t, "mario@x.ro");
    const ok = await t.mutation(api.subscribers.confirmByToken, { secret: SECRET, token: confirmToken! });
    expect(ok).toMatchObject({ ok: true, firstTime: true, email: "mario@x.ro" });
    expect(ok.unsubToken).toMatch(/^[0-9a-f]{32}$/);
    const d = await row(t, "mario@x.ro");
    expect(d).toMatchObject({ status: "subscribed" });
    expect(d?.confirmToken).toBeUndefined();
    expect(d?.confirmedAt).toBeTypeOf("number");
    expect(await client.query(api.subscribers.activeCount, {})).toBe(1);
    // il token non è riutilizzabile
    expect(await t.mutation(api.subscribers.confirmByToken, { secret: SECRET, token: confirmToken! })).toEqual({ ok: false, reason: "invalid" });
  });

  it("token non validi o con segreto errato sono rifiutati", async () => {
    const t = makeT();
    expect(await t.mutation(api.subscribers.confirmByToken, { secret: SECRET, token: "short" })).toEqual({ ok: false, reason: "invalid" });
    expect(await t.mutation(api.subscribers.confirmByToken, { secret: SECRET, token: "f".repeat(32) })).toEqual({ ok: false, reason: "invalid" });
    await expect(t.mutation(api.subscribers.confirmByToken, { secret: "wrong", token: "f".repeat(32) })).rejects.toThrow(/Unauthorized/);
  });

  it("il link di conferma scade dopo 7 giorni", async () => {
    const t = makeT();
    const { confirmToken } = await sub(t, "late@x.ro");
    await t.run(async (ctx) => {
      const d = await ctx.db.query("subscribers").withIndex("by_email", (q) => q.eq("email", "late@x.ro")).first();
      await ctx.db.patch(d!._id, { confirmSentAt: Date.now() - 8 * 86_400_000 });
    });
    expect(await t.mutation(api.subscribers.confirmByToken, { secret: SECRET, token: confirmToken! })).toEqual({ ok: false, reason: "expired" });
    expect((await row(t, "late@x.ro"))?.status).toBe("pending");
    // una nuova richiesta (oltre il throttle) emette un nuovo link valido e invalida il vecchio
    const again = await sub(t, "late@x.ro");
    expect(again.send).toBe(true);
    expect(again.confirmToken).not.toBe(confirmToken);
    expect(await t.mutation(api.subscribers.confirmByToken, { secret: SECRET, token: confirmToken! })).toEqual({ ok: false, reason: "invalid" });
    expect((await t.mutation(api.subscribers.confirmByToken, { secret: SECRET, token: again.confirmToken! })).ok).toBe(true);
  });

  it("throttle: max 1 email di conferma ogni 10 minuti per indirizzo (anti-abuso)", async () => {
    const t = makeT();
    expect((await sub(t, "spam@x.ro")).send).toBe(true);
    expect((await sub(t, "spam@x.ro")).send).toBe(false);
    expect((await sub(t, "SPAM@x.ro")).send).toBe(false);
    await t.run(async (ctx) => {
      const d = await ctx.db.query("subscribers").withIndex("by_email", (q) => q.eq("email", "spam@x.ro")).first();
      await ctx.db.patch(d!._id, { confirmSentAt: Date.now() - 11 * 60_000 });
    });
    expect((await sub(t, "spam@x.ro")).send).toBe(true);
  });

  it("anti-enumerazione: già attivo o bloccato → nessuna email e nessuna modifica", async () => {
    const t = makeT();
    const { confirmToken } = await sub(t, "active@x.ro");
    await t.mutation(api.subscribers.confirmByToken, { secret: SECRET, token: confirmToken! });
    expect(await sub(t, "active@x.ro")).toEqual({ send: false });
    expect((await row(t, "active@x.ro"))?.status).toBe("subscribed");

    const b = await sub(t, "bad@x.ro");
    await t.mutation(api.subscribers.confirmByToken, { secret: SECRET, token: b.confirmToken! });
    await t.mutation(api.subscribers.suppressByEmail, { secret: SECRET, email: "BAD@x.ro" });
    expect(await sub(t, "bad@x.ro")).toEqual({ send: false });
    expect((await row(t, "bad@x.ro"))?.status).toBe("suppressed");
  });

  it("disiscrizione e ri-iscrizione: serve di nuovo la conferma", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    const { confirmToken } = await sub(t, "mario@x.ro");
    const c = await t.mutation(api.subscribers.confirmByToken, { secret: SECRET, token: confirmToken! });
    expect(await t.mutation(api.subscribers.unsubscribeByToken, { secret: SECRET, token: "short" })).toEqual({ ok: false });
    expect(await t.mutation(api.subscribers.unsubscribeByToken, { secret: SECRET, token: "f".repeat(32) })).toEqual({ ok: false });
    expect(await t.mutation(api.subscribers.unsubscribeByToken, { secret: SECRET, token: c.unsubToken! })).toEqual({ ok: true });
    expect(await client.query(api.subscribers.stats, {})).toEqual({ pending: 0, subscribed: 0, unsubscribed: 1, suppressed: 0 });

    const again = await sub(t, "mario@x.ro");
    expect(again.send).toBe(true);
    expect((await row(t, "mario@x.ro"))?.status).toBe("pending"); // NON torna attivo da solo
    expect(await client.query(api.subscribers.activeCount, {})).toBe(0);
    await t.mutation(api.subscribers.confirmByToken, { secret: SECRET, token: again.confirmToken! });
    expect(await client.query(api.subscribers.activeCount, {})).toBe(1);
  });

  it("i pending non ricevono campagne e vengono cancellati dopo 30 giorni", async () => {
    const t = makeT();
    await sub(t, "fresh@x.ro");
    await sub(t, "old@x.ro");
    await t.run(async (ctx) => {
      const d = await ctx.db.query("subscribers").withIndex("by_email", (q) => q.eq("email", "old@x.ro")).first();
      await ctx.db.patch(d!._id, { confirmSentAt: Date.now() - 31 * 86_400_000 });
    });
    expect(await t.query(internal.subscribers.recipientsPage, { limit: 100 })).toEqual([]);
    expect(await t.mutation(internal.subscribers.pruneUnconfirmed, {})).toBe(1);
    expect(await row(t, "old@x.ro")).toBeNull();
    expect(await row(t, "fresh@x.ro")).not.toBeNull();
  });

  it("l'admin non può attivare né 'confermare' al posto della persona", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    await sub(t, "x@x.ro");
    const [item] = await client.query(api.subscribers.list, {});
    await expect(client.mutation(api.subscribers.adminSetStatus, { id: item._id, status: "subscribed" })).rejects.toThrow(/NOT_ALLOWED/);
    await expect(client.mutation(api.subscribers.adminSetStatus, { id: item._id, status: "pending" })).rejects.toThrow(/NOT_ALLOWED/);
    await client.mutation(api.subscribers.adminSetStatus, { id: item._id, status: "unsubscribed" }); // ritirare è sempre ammesso
  });

  it("aggiunta manuale richiede consenso e valida l'email", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    await expect(client.mutation(api.subscribers.adminAdd, { email: "a@b.ro", consentConfirmed: false })).rejects.toThrow(/CONSENT_REQUIRED/);
    await expect(client.mutation(api.subscribers.adminAdd, { email: "not-an-email", consentConfirmed: true })).rejects.toThrow(/INVALID_EMAIL/);
    await client.mutation(api.subscribers.adminAdd, { email: "ok@b.ro", consentConfirmed: true });
    await expect(client.mutation(api.subscribers.adminAdd, { email: "OK@b.ro", consentConfirmed: true })).rejects.toThrow(/ALREADY_EXISTS/);
  });
});
