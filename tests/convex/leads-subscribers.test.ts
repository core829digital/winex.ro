// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
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

describe("newsletter", () => {
  it("iscrizione idempotente, token, disiscrizione e re-iscrizione con consenso", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    const a = await t.mutation(api.subscribers.subscribe, { secret: SECRET, email: " Mario@X.RO ", source: "website", consent: true });
    expect(a.created).toBe(true);
    expect(a.token).toMatch(/^[0-9a-f]{32}$/);
    const b = await t.mutation(api.subscribers.subscribe, { secret: SECRET, email: "mario@x.ro", source: "website", consent: true });
    expect(b).toEqual({ created: false, token: a.token });

    // il token non viene mai esposto all'admin UI
    const list = await client.query(api.subscribers.list, {});
    expect(list).toHaveLength(1);
    expect(list[0]).not.toHaveProperty("unsubToken");
    expect(list[0].email).toBe("mario@x.ro");

    expect(await t.mutation(api.subscribers.unsubscribeByToken, { secret: SECRET, token: "short" })).toEqual({ ok: false });
    expect(await t.mutation(api.subscribers.unsubscribeByToken, { secret: SECRET, token: "f".repeat(32) })).toEqual({ ok: false });
    expect(await t.mutation(api.subscribers.unsubscribeByToken, { secret: SECRET, token: a.token })).toEqual({ ok: true });
    expect(await client.query(api.subscribers.stats, {})).toEqual({ subscribed: 0, unsubscribed: 1, suppressed: 0 });

    const again = await t.mutation(api.subscribers.subscribe, { secret: SECRET, email: "mario@x.ro", source: "website", consent: true });
    expect(again).toEqual({ created: true, token: a.token });
    expect((await client.query(api.subscribers.stats, {})).subscribed).toBe(1);
  });

  it("bounce/reclamo → suppressed e non si riattiva da solo né da admin", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    const s = await t.mutation(api.subscribers.subscribe, { secret: SECRET, email: "bad@x.ro", source: "website", consent: true });
    await t.mutation(api.subscribers.suppressByEmail, { secret: SECRET, email: "BAD@x.ro" });
    expect((await client.query(api.subscribers.stats, {})).suppressed).toBe(1);
    const re = await t.mutation(api.subscribers.subscribe, { secret: SECRET, email: "bad@x.ro", source: "website", consent: true });
    expect(re.created).toBe(false);
    expect((await client.query(api.subscribers.stats, {})).suppressed).toBe(1);

    const [row] = await client.query(api.subscribers.list, {});
    await expect(client.mutation(api.subscribers.adminSetStatus, { id: row._id, status: "subscribed" })).rejects.toThrow(/NOT_ALLOWED/);
    expect(s.token).toBeTruthy();
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
