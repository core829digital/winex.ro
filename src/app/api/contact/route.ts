import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { convex, convexReady, env, esc, guard, readJson, refs, resend, resendReady } from "@/lib/server";
import { site } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const g = guard(req);
  if (!g.ok) return NextResponse.json({ error: "Cerere respinsă." }, { status: 403 });
  if (!rateLimit(`contact:${g.ip}`, 5, 10 * 60_000))
    return NextResponse.json({ error: "Prea multe încercări. Reîncearcă peste câteva minute." }, { status: 429 });

  const body = await readJson(req);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Date invalide." }, { status: 400 });
  }
  const { website, ...data } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // honeypot: rispondi "ok" senza fare nulla

  if (!convexReady && !(resendReady && env.to)) {
    console.error("[contact] Nessun canale configurato (Convex / Resend).");
    return NextResponse.json({ error: "Serviciul nu este disponibil momentan. Ne poți suna sau scrie direct." }, { status: 503 });
  }

  let stored = false;
  let mailed = false;

  if (convexReady) {
    try {
      await convex().mutation(refs.createLead, {
        secret: env.ingestSecret!,
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        source: "contact",
        consent: true,
      });
      stored = true;
    } catch (e) {
      console.error("[contact] Convex error", e);
    }
  }

  if (resendReady && env.to) {
    try {
      const r = resend();
      const { error } = await r.emails.send({
        from: env.from!,
        to: env.to,
        replyTo: data.email,
        subject: `[Winex.ro] ${data.subject || "Mesaj nou"} — ${data.name}`,
        html: `<h2>Mesaj nou de pe winex.ro</h2>
<p><b>Nume:</b> ${esc(data.name)}<br><b>E-mail:</b> ${esc(data.email)}<br><b>Telefon:</b> ${esc(data.phone ?? "—")}</p>
<p style="white-space:pre-wrap">${esc(data.message)}</p>`,
      });
      if (error) throw error;
      mailed = true;
      // conferma al cliente (best-effort)
      await r.emails
        .send({
          from: env.from!,
          to: data.email,
          subject: `Am primit mesajul tău — ${site.name}`,
          html: `<p>Bună, ${esc(data.name)},</p><p>Am primit mesajul tău și revenim cât mai curând.</p><p>— Echipa ${site.name}</p>`,
        })
        .catch(() => undefined);
    } catch (e) {
      console.error("[contact] Resend error", e);
    }
  }

  if (!stored && !mailed) {
    return NextResponse.json({ error: "Nu am putut trimite mesajul. Te rugăm să reîncerci." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
