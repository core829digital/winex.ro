import { query } from "./_generated/server";
import { adminEmails, requireAdmin } from "./lib/admin";

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireAdmin(ctx);
    const allowed = adminEmails();
    const users = await ctx.db.query("users").take(100);
    const known = new Set(users.map((u) => u.email?.toLowerCase()));
    const log = await ctx.db.query("auditLog").withIndex("by_at").order("desc").take(50);
    return {
      me: me.email,
      admins: allowed.map((email) => ({ email, hasSignedIn: known.has(email) })),
      log,
    };
  },
});

/** Verifica rapida per la shell admin: l'utente autenticato è davvero un admin autorizzato? */
export const whoami = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireAdmin(ctx);
    return { email: me.email };
  },
});
