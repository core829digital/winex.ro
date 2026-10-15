import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { postStatus } from "./schema";
import { audit, requireAdmin } from "./lib/admin";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("posts").withIndex("by_updatedAt").order("desc").take(200);
  },
});

export const get = query({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    return await ctx.db.get(id);
  },
});

export const save = mutation({
  args: {
    id: v.optional(v.id("posts")),
    title: v.string(),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.string(),
    coverUrl: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    status: postStatus,
  },
  handler: async (ctx, { id, ...f }) => {
    const admin = await requireAdmin(ctx);
    const title = f.title.trim();
    if (!title) throw new ConvexError("TITLE_REQUIRED");
    if (f.content.length > 200000) throw new ConvexError("TOO_LONG");
    const slug = slugify(f.slug?.trim() || title);
    if (!slug) throw new ConvexError("INVALID_SLUG");
    const clash = await ctx.db.query("posts").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    if (clash && clash._id !== id) throw new ConvexError("SLUG_TAKEN");

    const prev = id ? await ctx.db.get(id) : null;
    const now = Date.now();
    const data = {
      title,
      slug,
      excerpt: f.excerpt?.trim() || undefined,
      content: f.content,
      coverUrl: f.coverUrl?.trim() || undefined,
      seoTitle: f.seoTitle?.trim() || undefined,
      seoDescription: f.seoDescription?.trim() || undefined,
      status: f.status,
      publishedAt: f.status === "published" ? (prev?.publishedAt ?? now) : undefined,
      authorEmail: prev?.authorEmail ?? admin.email,
      updatedAt: now,
    };
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    }
    return await ctx.db.insert("posts", data);
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);
    const p = await ctx.db.get(id);
    if (!p) return;
    await ctx.db.delete(id);
    await audit(ctx, admin.email, "post.delete", p.title);
  },
});
