import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { api, convex, convexReady, env, guard, readJson, resend, resendReady } from "@/lib/server";
import { confirmationEmail } from "@/lib/newsletter-mail";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Iscrizione con DOPPIA CONFERMA (double opt-in).
 * La risposta è sempre identica ("controlla la tua e-mail"), anche se l'indirizzo era già iscritto:
 * nessuno può scoprire chi è iscritto, né usare il form per spedire e-mail a terzi in massa
 * (max 1 conferma ogni 10 minuti per indirizzo + rate limit per IP).
 */
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
  if (website) return NextResponse.json({ ok: true, pending: true }); // honeypot

  // Senza Convex (registro del consenso) e senza Resend (invio conferma) non si può fare double opt-in.
  if (!convexReady || !resendReady) {
    console.error("[newsletter] Servono Convex e Resend per la doppia conferma.");
    return NextResponse.json({ error: "Serviciul nu este disponibil momentan." }, { status: 503 });
  }

  let result: { send: boolean; confirmToken?: string };
  try {
    result = await convex().mutation(api.subscribers.subscribe, { secret: env.ingestSecret!, email, source: "website", consent: true });
  } catch (e) {
    console.error("[newsletter] Convex error", e);
    return NextResponse.json({ error: "Nu am putut finaliza abonarea. Reîncearcă." }, { status: 502 });
  }

  if (result.send && result.confirmToken) {
    const mail = confirmationEmail(site.url, result.confirmToken);
    const { error } = await resend().emails.send({ from: env.from!, to: email, subject: mail.subject, html: mail.html, text: mail.text });
    if (error) {
      console.error("[newsletter] Resend error", error);
      return NextResponse.json({ error: "Nu am putut trimite e-mailul de confirmare. Reîncearcă." }, { status: 502 });
    }
  }
  return NextResponse.json({ ok: true, pending: true });
}
