import "server-only";
import webpush from "web-push";
import { api, convex, convexReady, env } from "./server";

/** Notifica push a tutti i dispositivi admin registrati. Il payload non contiene dati sensibili. */
export async function notifyAdmins(payload: { title: string; body: string; url: string }) {
  if (!convexReady || !env.vapidPublic || !env.vapidPrivate) return;
  try {
    webpush.setVapidDetails(env.vapidSubject ?? "mailto:admin@winex.ro", env.vapidPublic, env.vapidPrivate);
    const client = convex();
    const subs = await client.query(api.push.listForServer, { secret: env.ingestSecret! });
    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
            { TTL: 3600, urgency: "high" },
          );
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await client.mutation(api.push.removeGone, { secret: env.ingestSecret!, endpoint: s.endpoint });
          } else console.error("[push] errore", code);
        }
      }),
    );
  } catch (e) {
    console.error("[push] errore", e);
  }
}
