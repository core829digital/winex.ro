import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { convex, convexReady, env, esc, guard, readJson, refs, resend, resendReady } from "@/lib/server";
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

  if (convexReady) {
    try {
      const res = (await convex().mutation(refs.subscribe, {
        secret: env.ingestSecret!,
        email,
        source: "website",
        consent: true,
      })) as { created: boolean };
      isNew = res.created;
      ok = true;
    } catch (e) {
      console.error("[newsletter] Convex error", e);
    }
  }

  if (resendReady && env.audienceId) {
    try {
      const r = resend();
      const { error } = await r.contacts.create({ email, audienceId: env.audienceId, unsubscribed: false });
      if (error) throw error;
      ok = true;
      if (isNew) {
        await r.emails
          .send({
            from: env.from!,
            to: email,
            subject: `Bun venit la ${site.name}`,
            html: `<p>Mulțumim pentru abonare la newsletterul ${esc(site.name)}.</p><p>Te poți dezabona oricând, răspunzând la acest mesaj.</p>`,
          })
          .catch(() => undefined);
      }
    } catch (e) {
      console.error("[newsletter] Resend error", e);
    }
  }

  if (!ok) return NextResponse.json({ error: "Nu am putut finaliza abonarea. Reîncearcă." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
