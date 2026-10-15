import { NextResponse, after } from "next/server";
import { contactSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import {
  api,
  convex,
  convexReady,
  env,
  esc,
  getServerSettings,
  guard,
  readJson,
  resend,
  resendReady,
} from "@/lib/server";
import { notifyAdmins } from "@/lib/push";
import { site } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const g = guard(req);
  if (!g.ok) return NextResponse.json({ error: "Cerere respinsă." }, { status: 403 });
  if (!rateLimit(`contact:${g.ip}`, 5, 10 * 60_000))
    return NextResponse.json({ error: "Prea multe încercări. Reîncearcă peste câteva minute." }, { status: 429 });

  const parsed = contactSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Date invalide." }, { status: 400 });
  }
  const { website, ...data } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // honeypot

  const settings = await getServerSettings();
  const notif = (settings.notifications ?? {}) as { leadEmailTo?: string; pushOnLead?: boolean };
  const teamTo = notif.leadEmailTo?.trim() || env.to;

  if (!convexReady && !(resendReady && teamTo)) {
    console.error("[contact] Nessun canale configurato (Convex / Resend).");
    return NextResponse.json({ error: "Serviciul nu este disponibil momentan. Ne poți suna sau scrie direct." }, { status: 503 });
  }

  let stored = false;
  let mailed = false;

  if (convexReady) {
    try {
      await convex().mutation(api.leads.create, {
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

  if (resendReady && teamTo) {
    try {
      const { error } = await resend().emails.send({
        from: env.from!,
        to: teamTo,
        replyTo: data.email,
        subject: `[Winex.ro] ${data.subject || "Mesaj nou"} — ${data.name}`,
        html: `<h2>Mesaj nou de pe winex.ro</h2>
<p><b>Nume:</b> ${esc(data.name)}<br><b>E-mail:</b> ${esc(data.email)}<br><b>Telefon:</b> ${esc(data.phone ?? "—")}</p>
<p style="white-space:pre-wrap">${esc(data.message)}</p>`,
      });
      if (error) throw error;
      mailed = true;
    } catch (e) {
      console.error("[contact] Resend error", e);
    }
  }

  if (!stored && !mailed) {
    return NextResponse.json({ error: "Nu am putut trimite mesajul. Te rugăm să reîncerci." }, { status: 502 });
  }

  // Dopo la risposta: conferma al cliente e notifica push (non rallentano il form).
  after(async () => {
    if (resendReady) {
      await resend()
        .emails.send({
          from: env.from!,
          to: data.email,
          subject: `Am primit mesajul tău — ${site.name}`,
          html: `<p>Bună, ${esc(data.name)},</p><p>Am primit mesajul tău și revenim cât mai curând.</p><p>— Echipa ${site.name}</p>`,
        })
        .catch(() => undefined);
    }
    if (notif.pushOnLead !== false) {
      await notifyAdmins({ title: "Mesaj nou — winex.ro", body: `De la ${data.name}`, url: "/admin/mesaje" });
    }
  });

  return NextResponse.json({ ok: true });
}
