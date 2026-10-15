import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const leadStatus = v.union(
  v.literal("new"),
  v.literal("read"),
  v.literal("replied"),
  v.literal("archived"),
);
export const subscriberStatus = v.union(
  v.literal("pending"), // in attesa di conferma via email (double opt-in)
  v.literal("subscribed"),
  v.literal("unsubscribed"),
  v.literal("suppressed"), // bounce / complaint: non si scrive più
);
export const campaignStatus = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("sending"),
  v.literal("sent"),
  v.literal("failed"),
);
export const postStatus = v.union(v.literal("draft"), v.literal("published"));

export default defineSchema({
  ...authTables,

  /* ---------------------------- Messaggi (form contatti) ---------------------------- */
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    source: v.string(), // "contact" | "configurator"
    consent: v.boolean(),
    status: leadStatus,
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status_createdAt", ["status", "createdAt"]),

  /* -------------------------------- Newsletter -------------------------------------- */
  subscribers: defineTable({
    email: v.string(),
    consent: v.boolean(),
    source: v.string(),
    status: subscriberStatus,
    unsubToken: v.string(),
    confirmToken: v.optional(v.string()), // monouso: azzerato alla conferma
    confirmSentAt: v.optional(v.number()),
    confirmedAt: v.optional(v.number()),
    subscribedAt: v.number(), // data della richiesta di iscrizione
    unsubscribedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_token", ["unsubToken"])
    .index("by_confirmToken", ["confirmToken"])
    .index("by_status", ["status"]),

  /* --------------------------------- Campagne email --------------------------------- */
  campaigns: defineTable({
    name: v.string(),
    subject: v.string(),
    preheader: v.optional(v.string()),
    body: v.string(), // mini-markdown
    ctaLabel: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    status: campaignStatus,
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    error: v.optional(v.string()),
    testNote: v.optional(v.string()),
    stats: v.object({
      recipients: v.number(),
      sent: v.number(),
      delivered: v.number(),
      opened: v.number(),
      clicked: v.number(),
      bounced: v.number(),
      complained: v.number(),
    }),
    createdBy: v.string(),
    updatedAt: v.number(),
  })
    .index("by_updatedAt", ["updatedAt"])
    .index("by_status", ["status"]),

  emailEvents: defineTable({
    campaignId: v.id("campaigns"),
    email: v.string(),
    type: v.string(), // delivered | opened | clicked | bounced | complained
    link: v.optional(v.string()),
    at: v.number(),
  }).index("by_campaign_email_type", ["campaignId", "email", "type"]),

  /* ------------------------------ Analytics (senza cookie) -------------------------- */
  events: defineTable({
    t: v.number(),
    type: v.string(), // "pv" | "click"
    vid: v.string(), // hash anonimo giornaliero
    path: v.string(),
    ref: v.optional(v.string()),
    device: v.string(),
    country: v.optional(v.string()),
    label: v.optional(v.string()),
  }).index("by_t", ["t"]),

  counters: defineTable({
    day: v.string(), // YYYY-MM-DD (Europe/Bucharest)
    kind: v.string(), // views | visitors | path | ref | device | country | click | h
    key: v.string(),
    n: v.number(),
  })
    .index("by_kind_day", ["kind", "day"])
    .index("by_day_kind_key", ["day", "kind", "key"]),

  visitorDays: defineTable({ day: v.string(), vid: v.string() }).index("by_day_vid", ["day", "vid"]),

  /* ----------------------------------- Blog ----------------------------------------- */
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.string(), // markdown
    coverUrl: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    status: postStatus,
    publishedAt: v.optional(v.number()),
    authorEmail: v.string(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status_publishedAt", ["status", "publishedAt"])
    .index("by_updatedAt", ["updatedAt"]),

  /* ------------------------------ Impostazioni / contenuti -------------------------- */
  settings: defineTable({ key: v.string(), value: v.any(), updatedAt: v.number() }).index("by_key", ["key"]),

  /* --------------------------------- Notifiche push --------------------------------- */
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_endpoint", ["endpoint"])
    .index("by_user", ["userId"]),

  /* ----------------------------------- Audit ---------------------------------------- */
  auditLog: defineTable({
    at: v.number(),
    actor: v.string(),
    action: v.string(),
    target: v.optional(v.string()),
  }).index("by_at", ["at"]),
});
