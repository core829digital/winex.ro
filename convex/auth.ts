import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "./ResendOTP";
import { isAdminEmail } from "./lib/admin";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ResendOTP],
  session: {
    totalDurationMs: 7 * 24 * 60 * 60 * 1000, // max 7 giorni
    inactiveDurationMs: 12 * 60 * 60 * 1000, // 12 ore di inattività
  },
  callbacks: {
    /** Nessun account può esistere se l'email non è autorizzata (difesa in profondità). */
    async createOrUpdateUser(ctx, args) {
      const email = (args.profile.email as string | undefined)?.trim().toLowerCase();
      if (!isAdminEmail(email)) throw new Error("Not authorized");
      if (args.existingUserId) return args.existingUserId;
      return await ctx.db.insert("users", { email, emailVerificationTime: Date.now() });
    },
  },
});
