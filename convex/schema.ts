import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    source: v.string(), // "contact" | "configurator" | ...
    consent: v.boolean(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  subscribers: defineTable({
    email: v.string(),
    consent: v.boolean(),
    source: v.string(),
    subscribedAt: v.number(),
  }).index("by_email", ["email"]),
});
