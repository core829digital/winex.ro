import { v, ConvexError } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { assertIngestSecret, audit, isAdminEmail, requireAdmin } from "./lib/admin";
import { renderEmailHtml, renderEmailText, safeUrl } from "./lib/emailTemplate";

const emptyStats = { recipients: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
const EVENT_FIELDS = ["delivered", "opened", "clicked", "bounced", "complained"] as const;

/* ------------------------------------------------------------------ CRUD ------------- */

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("campaigns").withIndex("by_updatedAt").order("desc").take(100);
  },
});

export const get = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    return await ctx.db.get(id);
  },
});

export const save = mutation({
  args: {
    id: v.optional(v.id("campaigns")),
    name: v.string(),
    subject: v.string(),
    preheader: v.optional(v.string()),
    body: v.string(),
    ctaLabel: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...f }) => {
    const admin = await requireAdmin(ctx);
    if (f.name.length > 120 || f.subject.length > 200 || (f.preheader?.length ?? 0) > 200 || f.body.length > 30000)
      throw new ConvexError("TOO_LONG");
    if (f.ctaUrl && !safeUrl(f.ctaUrl)) throw new ConvexError("INVALID_CTA_URL");
    const data = {
      name: f.name.trim(),
      subject: f.subject.trim(),
      preheader: f.preheader?.trim() || undefined,
      body: f.body,
      ctaLabel: f.ctaLabel?.trim() || undefined,
      ctaUrl: f.ctaUrl?.trim() || undefined,
      updatedAt: Date.now(),
    };
    if (id) {
      const c = await ctx.db.get(id);
      if (!c) throw new ConvexError("NOT_FOUND");
      if (c.status !== "draft" && c.status !== "failed") throw new ConvexError("LOCKED");
      await ctx.db.patch(id, { ...data, status: "draft", error: undefined });
      return id;
    }
    return await ctx.db.insert("campaigns", { ...data, status: "draft", stats: emptyStats, createdBy: admin.email });
  },
});

export const remove = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);
    const c = await ctx.db.get(id);
    if (!c) return;
    if (c.status === "sending" || c.status === "scheduled") throw new ConvexError("LOCKED");
    await ctx.db.delete(id);
    await audit(ctx, admin.email, "campaign.delete", c.name);
  },
});

/* ------------------------------------------------------------- Invio / test ---------- */

export const sendTest = mutation({
  args: { id: v.id("campaigns"), to: v.optional(v.string()) },
  handler: async (ctx, { id, to }) => {
    const admin = await requireAdmin(ctx);
    const target = (to?.trim().toLowerCase() || admin.email);
    if (!isAdminEmail(target)) throw new ConvexError("TEST_ONLY_TO_ADMINS");
    await ctx.db.patch(id, { testNote: "Se trimite…" });
    await ctx.scheduler.runAfter(0, internal.campaigns.runTest, { id, to: target });
  },
});

/** Invio immediato o programmato (at = ms epoch). */
export const send = mutation({
  args: { id: v.id("campaigns"), at: v.optional(v.number()) },
  handler: async (ctx, { id, at }) => {
    const admin = await requireAdmin(ctx);
    const c = await ctx.db.get(id);
    if (!c) throw new ConvexError("NOT_FOUND");
    if (c.status !== "draft" && c.status !== "failed") throw new ConvexError("LOCKED");
    if (!c.subject.trim() || !c.body.trim()) throw new ConvexError("EMPTY");
    const now = Date.now();
    const when = at && at > now + 30_000 ? at : now;
    await ctx.db.patch(id, { status: "scheduled", scheduledAt: when, error: undefined, updatedAt: now });
    await ctx.scheduler.runAt(when, internal.campaigns.runSend, { id, scheduledAt: when });
    await audit(ctx, admin.email, when === now ? "campaign.send" : "campaign.schedule", c.name);
  },
});

export const cancelSchedule = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.status !== "scheduled") throw new ConvexError("NOT_SCHEDULED");
    await ctx.db.patch(id, { status: "draft", scheduledAt: undefined, updatedAt: Date.now() });
    await audit(ctx, admin.email, "campaign.unschedule", c.name);
  },
});

/* ------------------------------------------------------- Interni (azioni) ------------ */

export const begin = internalMutation({
  args: { id: v.id("campaigns"), scheduledAt: v.number() },
  handler: async (ctx, { id, scheduledAt }) => {
    const c = await ctx.db.get(id);
    // Se nel frattempo è stata annullata/riprogrammata, il vecchio job non fa nulla.
    if (!c || c.status !== "scheduled" || c.scheduledAt !== scheduledAt) return null;
    await ctx.db.patch(id, { status: "sending" });
    return c;
  },
});

export const addSent = internalMutation({
  args: { id: v.id("campaigns"), n: v.number() },
  handler: async (ctx, { id, n }) => {
    const c = await ctx.db.get(id);
    if (!c) return;
    await ctx.db.patch(id, { stats: { ...c.stats, sent: c.stats.sent + n, recipients: c.stats.recipients + n } });
  },
});

export const finish = internalMutation({
  args: { id: v.id("campaigns"), error: v.optional(v.string()) },
  handler: async (ctx, { id, error }) => {
    await ctx.db.patch(id, error ? { status: "failed", error } : { status: "sent", sentAt: Date.now(), error: undefined });
  },
});

export const setTestNote = internalMutation({
  args: { id: v.id("campaigns"), note: v.string() },
  handler: async (ctx, { id, note }) => {
    await ctx.db.patch(id, { testNote: note });
  },
});

export const companyLine = internalQuery({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "company")).first();
    const c = (row?.value ?? {}) as Record<string, string | undefined>;
    return [c.legalName, c.address, c.cui ? `CUI ${c.cui}` : ""].filter(Boolean).join(" · ");
  },
});

const BATCH = 100;
const siteUrl = () => (process.env.SITE_URL ?? "https://www.winex.ro").replace(/\/$/, "");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function resendBatch(emails: unknown[], idempotencyKey: string) {
  const key = process.env.RESEND_API_KEY ?? process.env.AUTH_RESEND_KEY;
  if (!key) throw new Error("RESEND_API_KEY non configurata in Convex");
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(emails),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

export const runSend = internalAction({
  args: { id: v.id("campaigns"), scheduledAt: v.number() },
  handler: async (ctx, { id, scheduledAt }) => {
    const c = await ctx.runMutation(internal.campaigns.begin, { id, scheduledAt });
    if (!c) return;
    try {
      const from = process.env.RESEND_FROM;
      if (!from) throw new Error("RESEND_FROM non configurato in Convex");
      const line = await ctx.runQuery(internal.campaigns.companyLine, {});
      let after: number | undefined;
      let batchNo = 0;
      for (;;) {
        const page = await ctx.runQuery(internal.subscribers.recipientsPage, { after, limit: BATCH });
        if (page.length === 0) break;
        const emails = page.map((r) => {
          const unsubscribeUrl = `${siteUrl()}/dezabonare?t=${r.token}`;
          const input = {
            subject: c.subject,
            preheader: c.preheader,
            body: c.body,
            ctaLabel: c.ctaLabel,
            ctaUrl: c.ctaUrl,
            unsubscribeUrl,
            siteUrl: siteUrl(),
            companyLine: line,
          };
          return {
            from,
            to: [r.email],
            subject: c.subject,
            html: renderEmailHtml(input),
            text: renderEmailText(input),
            headers: {
              "List-Unsubscribe": `<${siteUrl()}/api/unsubscribe?t=${r.token}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
            tags: [{ name: "campaign_id", value: String(id) }],
          };
        });
        await resendBatch(emails, `${id}-${scheduledAt}-${batchNo}`);
        await ctx.runMutation(internal.campaigns.addSent, { id, n: page.length });
        after = page[page.length - 1].ct;
        batchNo++;
        if (page.length < BATCH) break;
        await sleep(600); // limite Resend: 2 richieste/secondo
      }
      await ctx.runMutation(internal.campaigns.finish, { id });
    } catch (e) {
      await ctx.runMutation(internal.campaigns.finish, { id, error: e instanceof Error ? e.message : String(e) });
    }
  },
});

export const getForTest = internalQuery({
  args: { id: v.id("campaigns") },
  handler: async (ctx, { id }) => await ctx.db.get(id),
});

export const runTest = internalAction({
  args: { id: v.id("campaigns"), to: v.string() },
  handler: async (ctx, { id, to }) => {
    try {
      const c = await ctx.runQuery(internal.campaigns.getForTest, { id });
      if (!c) return;
      const from = process.env.RESEND_FROM;
      if (!from) throw new Error("RESEND_FROM non configurato in Convex");
      const line = await ctx.runQuery(internal.campaigns.companyLine, {});
      const input = {
        subject: c.subject,
        preheader: c.preheader,
        body: c.body,
        ctaLabel: c.ctaLabel,
        ctaUrl: c.ctaUrl,
        unsubscribeUrl: `${siteUrl()}/dezabonare`,
        siteUrl: siteUrl(),
        companyLine: line,
      };
      await resendBatch(
        [{ from, to: [to], subject: `[TEST] ${c.subject}`, html: renderEmailHtml(input), text: renderEmailText(input) }],
        `test-${id}-${Date.now()}`,
      );
      await ctx.runMutation(internal.campaigns.setTestNote, { id, note: `Test trimis la ${to}` });
    } catch (e) {
      await ctx.runMutation(internal.campaigns.setTestNote, {
        id,
        note: `Eroare test: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  },
});

/* ------------------------------------------------------- Webhook Resend (statistiche) - */

export const recordEvent = mutation({
  args: {
    secret: v.string(),
    campaignId: v.string(),
    email: v.string(),
    type: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, { secret, campaignId, email, type, link }) => {
    assertIngestSecret(secret);
    const id = ctx.db.normalizeId("campaigns", campaignId);
    const field = EVENT_FIELDS.find((f) => f === type);
    if (!id || !field) return;
    const c = await ctx.db.get(id);
    if (!c) return;
    const e = email.trim().toLowerCase();
    const dup = await ctx.db
      .query("emailEvents")
      .withIndex("by_campaign_email_type", (q) => q.eq("campaignId", id).eq("email", e).eq("type", field))
      .first();
    if (dup) return; // conteggi "unici" per destinatario
    await ctx.db.insert("emailEvents", { campaignId: id, email: e, type: field, link, at: Date.now() });
    await ctx.db.patch(id, { stats: { ...c.stats, [field]: c.stats[field] + 1 } });
  },
});
