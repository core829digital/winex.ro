// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { SECRET, asUser, makeT } from "./helpers";

describe("controllo accessi admin", () => {
  it("nega l'accesso senza sessione", async () => {
    const t = makeT();
    await expect(t.query(api.leads.list, {})).rejects.toThrow(/UNAUTHENTICATED/);
    await expect(t.query(api.analytics.live, { since: 0 })).rejects.toThrow(/UNAUTHENTICATED/);
    await expect(t.query(api.subscribers.list, {})).rejects.toThrow(/UNAUTHENTICATED/);
  });

  it("nega l'accesso a un utente autenticato ma NON in ADMIN_EMAILS", async () => {
    const t = makeT();
    const { client } = await asUser(t, "intruder@evil.com");
    await expect(client.query(api.leads.list, {})).rejects.toThrow(/FORBIDDEN/);
    await expect(client.mutation(api.campaigns.save, { name: "x", subject: "x", body: "x" })).rejects.toThrow(/FORBIDDEN/);
    await expect(client.query(api.team.whoami, {})).rejects.toThrow(/FORBIDDEN/);
  });

  it("consente l'accesso a un admin (confronto email case-insensitive)", async () => {
    const t = makeT();
    const { client } = await asUser(t, "Stefan@Core829.ro");
    expect(await client.query(api.team.whoami, {})).toEqual({ email: "stefan@core829.ro" });
  });

  it("le funzioni di ingestione rifiutano segreto errato o assente", async () => {
    const t = makeT();
    const lead = { name: "A", email: "a@b.ro", message: "mesaj lung", source: "contact", consent: true };
    await expect(t.mutation(api.leads.create, { secret: "wrong", ...lead })).rejects.toThrow(/Unauthorized/);
    await expect(t.mutation(api.leads.create, { secret: "", ...lead })).rejects.toThrow();
    await expect(t.mutation(api.subscribers.subscribe, { secret: "x".repeat(34), email: "a@b.ro", source: "w", consent: true })).rejects.toThrow(/Unauthorized/);
    await expect(t.mutation(api.analytics.record, { secret: "nope", type: "pv", day: "2026-10-15", hour: "10", vid: "v", path: "/", device: "mobile" })).rejects.toThrow();
    await expect(t.query(api.settings.getServer, { secret: "nope" })).rejects.toThrow();
    await expect(t.query(api.push.listForServer, { secret: "nope" })).rejects.toThrow();
    // con il segreto giusto funziona
    await expect(t.mutation(api.leads.create, { secret: SECRET, ...lead })).resolves.toBeTruthy();
  });
});
