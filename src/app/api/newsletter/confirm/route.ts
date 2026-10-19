import { NextResponse, after } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { api, convex, convexReady, env, getServerSettings, resend, resendReady } from "@/lib/server";
import { welcomeEmail } from "@/lib/newsletter-mail";
import { notifyAdmins } from "@/lib/push";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/** Conferma dell'iscrizione: chiamata dalla pagina /confirma-abonare dopo un click esplicito. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`confirm:${ip}`, 20, 10 * 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  if (!convexReady) return NextResponse.json({ ok: false }, { status: 503 });

  let token: string | undefined;
  try {
    token = ((await req.json()) as { token?: string }).token;
  } catch {}
  if (!token || typeof token !== "string") return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });

  let res;
  try {
    res = await convex().mutation(api.subscribers.confirmByToken, { secret: env.ingestSecret!, token });
  } catch (e) {
    console.error("[newsletter-confirm] Convex error", e);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  if (!res.ok) return NextResponse.json({ ok: false, reason: res.reason }, { status: res.reason === "expired" ? 410 : 404 });

  // Dopo la risposta: benvenuto, contatto nell'audience Resend (se configurata), push admin (se attiva).
  after(async () => {
    if (resendReady && res.email && res.unsubToken) {
      const mail = welcomeEmail(site.url, res.unsubToken, res.locale ?? "en");
      await resend()
        .emails.send({ from: env.from!, to: res.email, subject: mail.subject, html: mail.html, text: mail.text, headers: mail.headers })
        .catch((e) => console.error("[newsletter-confirm] welcome", e));
      if (env.audienceId) {
        await resend().contacts.create({ email: res.email, audienceId: env.audienceId, unsubscribed: false }).catch(() => undefined);
      }
    }
    const notif = ((await getServerSettings()).notifications ?? {}) as { pushOnSubscriber?: boolean };
    if (notif.pushOnSubscriber) await notifyAdmins({ title: "Abonat nou", body: "Un nou abonat a confirmat newsletterul.", url: "/admin/newsletter" });
  });

  return NextResponse.json({ ok: true });
}
