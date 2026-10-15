import { NextResponse, after } from "next/server";
import { newsletterSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { api, convex, convexReady, env, esc, getServerSettings, guard, readJson, resend, resendReady } from "@/lib/server";
import { notifyAdmins } from "@/lib/push";
import { site } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const g = guard(req);
  if (!g.ok) return NextResponse.json({ error: "Cerere respinsă." }, { status: 403 });
  if (!rateLimit(`news:${g.ip}`, 5, 10 * 60_000))
    return NextResponse.json({ error: "Prea multe încercări. Reîncearcă mai târziu." }, { status: 429 });

  const parsed = newsletterSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Date invalide." }, { status: 400 });
  }
  const { email, website } = parsed.data;
  if (website) return NextResponse.json({ ok: true });

  if (!convexReady && !(resendReady && env.audienceId)) {
    console.error("[newsletter] Nessun canale configurato (Convex / Resend audience).");
    return NextResponse.json({ error: "Serviciul nu este disponibil momentan." }, { status: 503 });
  }

  let ok = false;
  let isNew = true;
  let token: string | undefined;

  if (convexReady) {
    try {
      const res = await convex().mutation(api.subscribers.subscribe, {
        secret: env.ingestSecret!,
        email,
        source: "website",
        consent: true,
      });
      isNew = res.created;
      token = res.token;
      ok = true;
    } catch (e) {
      console.error("[newsletter] Convex error", e);
    }
  }

  if (resendReady && env.audienceId) {
    try {
      const { error } = await resend().contacts.create({ email, audienceId: env.audienceId, unsubscribed: false });
      if (error) throw error;
      ok = true;
    } catch (e) {
      console.error("[newsletter] Resend error", e);
    }
  }

  if (!ok) return NextResponse.json({ error: "Nu am putut finaliza abonarea. Reîncearcă." }, { status: 502 });

  after(async () => {
    if (!isNew) return;
    if (resendReady) {
      const unsub = token ? `<p style="font-size:12px;color:#6f7681"><a href="${site.url}/dezabonare?t=${token}">Dezabonează-te</a></p>` : "";
      await resend()
        .emails.send({
          from: env.from!,
          to: email,
          subject: `Bun venit la ${site.name}`,
          html: `<p>Mulțumim pentru abonare la newsletterul ${esc(site.name)}.</p>${unsub}`,
          headers: token
            ? {
                "List-Unsubscribe": `<${site.url}/api/unsubscribe?t=${token}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              }
            : undefined,
        })
        .catch(() => undefined);
    }
    const notif = ((await getServerSettings()).notifications ?? {}) as { pushOnSubscriber?: boolean };
    if (notif.pushOnSubscriber) await notifyAdmins({ title: "Abonat nou", body: "Un nou abonat la newsletter.", url: "/admin/newsletter" });
  });

  return NextResponse.json({ ok: true });
}
