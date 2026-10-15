import { convexTest } from "convex-test";
import schema from "../../convex/schema";

export const modules = import.meta.glob(["../../convex/**/*.ts", "../../convex/**/*.js", "!../../convex/**/*.d.ts"]);
export const SECRET = "test-ingest-secret-0123456789abcdef";

export function makeT() {
  return convexTest(schema, modules);
}
export type T = ReturnType<typeof makeT>;

/** Crea un utente e restituisce un client con identità Convex Auth (subject = userId|sessionId). */
export async function asUser(t: T, email: string) {
  const userId = await t.run(async (ctx) => ctx.db.insert("users", { email }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session-1` }) };
}
