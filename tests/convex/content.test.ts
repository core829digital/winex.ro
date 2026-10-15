// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { SECRET, asUser, makeT } from "./helpers";

describe("blog", () => {
  it("slug da titolo (diacritici), unicità, publishedAt stabile", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    const id = await client.mutation(api.posts.save, { title: "Ferestre eficiente — iarna în Roman!", content: "# x", status: "draft" });
    const p = await client.query(api.posts.get, { id });
    expect(p?.slug).toBe("ferestre-eficiente-iarna-in-roman");
    expect(p?.publishedAt).toBeUndefined();

    await expect(client.mutation(api.posts.save, { title: "Altul", slug: "ferestre-eficiente-iarna-in-roman", content: "x", status: "draft" })).rejects.toThrow(/SLUG_TAKEN/);
    await expect(client.mutation(api.posts.save, { title: "   ", content: "x", status: "draft" })).rejects.toThrow(/TITLE_REQUIRED/);

    await client.mutation(api.posts.save, { id, title: "Ferestre eficiente — iarna în Roman!", content: "# x", status: "published" });
    const first = (await client.query(api.posts.get, { id }))?.publishedAt;
    expect(first).toBeTypeOf("number");
    await client.mutation(api.posts.save, { id, title: "Titlu schimbat", content: "# y", status: "published", slug: "ferestre-eficiente-iarna-in-roman" });
    expect((await client.query(api.posts.get, { id }))?.publishedAt).toBe(first);
  });
});

describe("impostazioni", () => {
  const company = { legalName: "S.C. WINEX S.R.L.", cui: "RO1", regCom: "J1/1/2000", address: "Roman", phone: "+40", email: "c@winex.ro", hours: "L-V", facebook: "", instagram: "", linkedin: "" };

  it("salva dati societari e li serve al server con segreto", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    expect((await client.query(api.settings.getAdmin, {})).company).toBeNull();
    await client.mutation(api.settings.saveCompany, { value: company });
    await client.mutation(api.settings.saveCompany, { value: { ...company, phone: "+40 700" } }); // upsert
    const s = await t.query(api.settings.getServer, { secret: SECRET });
    expect(s.company).toMatchObject({ legalName: "S.C. WINEX S.R.L.", phone: "+40 700" });
    await expect(client.mutation(api.settings.saveCompany, { value: { ...company, address: "x".repeat(401) } })).rejects.toThrow(/TOO_LONG/);
  });

  it("notifiche: valida email destinatario", async () => {
    const t = makeT();
    const { client } = await asUser(t, "stefan@core829.ro");
    await expect(client.mutation(api.settings.saveNotifications, { value: { leadEmailTo: "nope", pushOnLead: true, pushOnSubscriber: false } })).rejects.toThrow(/INVALID_EMAIL/);
    await client.mutation(api.settings.saveNotifications, { value: { leadEmailTo: "mesaje@winex.ro", pushOnLead: true, pushOnSubscriber: true } });
    expect((await t.query(api.settings.getServer, { secret: SECRET })).notifications).toMatchObject({ leadEmailTo: "mesaje@winex.ro", pushOnSubscriber: true });
  });
});

describe("push", () => {
  it("registra, aggiorna, lista per server, rimuove e non tocca dispositivi altrui", async () => {
    const t = makeT();
    const a = await asUser(t, "stefan@core829.ro");
    const b = await asUser(t, "second@core829.ro");
    const sub = { endpoint: "https://push.example.com/abc", p256dh: "k", auth: "a", userAgent: "UA" };
    await a.client.mutation(api.push.saveSubscription, sub);
    await a.client.mutation(api.push.saveSubscription, { ...sub, p256dh: "k2" }); // upsert
    expect(await a.client.query(api.push.mine, {})).toHaveLength(1);
    expect((await t.query(api.push.listForServer, { secret: SECRET }))[0].p256dh).toBe("k2");
    await expect(a.client.mutation(api.push.saveSubscription, { ...sub, endpoint: "http://insecure" })).rejects.toThrow();

    await b.client.mutation(api.push.removeSubscription, { endpoint: sub.endpoint }); // non è suo: no-op
    expect(await t.query(api.push.listForServer, { secret: SECRET })).toHaveLength(1);
    await a.client.mutation(api.push.removeSubscription, { endpoint: sub.endpoint });
    expect(await t.query(api.push.listForServer, { secret: SECRET })).toHaveLength(0);

    await a.client.mutation(api.push.saveSubscription, sub);
    await t.mutation(api.push.removeGone, { secret: SECRET, endpoint: sub.endpoint });
    expect(await t.query(api.push.listForServer, { secret: SECRET })).toHaveLength(0);
  });
});
