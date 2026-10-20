import { NextResponse, after } from "next/server";
import { contactSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { createHash } from "node:crypto";
import { looksHostile, looksSpammy } from "@/lib/sanitize";
import { verifyFormToken } from "@/lib/form-token";
import {
  api,
  convex,
  convexReady,
  env,
  esc,
  getServerSettings,
  guardStrict,
  readJson,
  resend,
  resendReady,
  verifyTurnstile,
} from "@/lib/server";
import { notifyAdmins } from "@/lib/push";
import { contactReplyEmail } from "@/lib/newsletter-mail";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/** Risposta "ok" senza fare nulla: il bot non capisce di essere stato bloccato. */
const quietOk = () => NextResponse.json({ ok: true });

const FIELDS = ["name", "email", "phone", "subject", "message"] as const;
const seen = new Map<string, number>();

export async function POST(req: Request) {
  // 1. Provenienza: Origin coerente, Sec-Fetch-Site, User-Agent, JSON
  const g = guardStrict(req);
  if (!g.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json"))
    return NextResponse.json({ error: "forbidden" }, { status: 415 });

  // 2. Anti-flood: per IP (breve e giornaliero) e globale
  if (!rateLimit(`contact:${g.ip}`, 5, 10 * 60_000) || !rateLimit(`contact-day:${g.ip}`, 20, 24 * 3_600_000) || !rateLimit("contact:all", 120, 10 * 60_000))
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = await readJson(req);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "generic" }, { status: 400 });
  const raw = body as Record<string, unknown>;

  // 3. Firma del modulo (token HMAC, monouso, con tempo minimo/massimo e User-Agent)
  const tk = verifyFormToken(raw.ft, g.ua);
  if (!tk.ok) {
    console.warn(`[contact] token rifiutato: ${tk.reason}`);
    return NextResponse.json({ error: "verification_failed" }, { status: 403 });
  }

  // 4. Honeypot e input ostile (XSS / injection) sul testo GREZZO
  if (typeof raw.website === "string" && raw.website.trim()) return quietOk();
  const rawText = FIELDS.map((k) => (typeof raw[k] === "string" ? (raw[k] as string) : "")).join(" ");
  if (looksHostile(rawText)) {
    console.warn("[contact] input ostile bloccato");
    return quietOk();
  }

  // 5. Validazione + sanitizzazione (Zod)
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "generic" }, { status: 400 });
  }
  const { website: _hp, ft: _ft, turnstile, ...data } = parsed.data;
  void _hp;
  void _ft;

  // 6. Anti-bot: Turnstile (se attivo)
  if (!(await verifyTurnstile(turnstile, g.ip))) return NextResponse.json({ error: "verification_failed" }, { status: 403 });

  // 7. Spam, flood per indirizzo email e duplicati
  if (looksSpammy(`${data.subject ?? ""}
${data.message}`)) {
    console.warn("[contact] spam bloccato");
    return quietOk();
  }
  if (!rateLimit(`contact-email:${data.email}`, 3, 3_600_000)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const fingerprint = createHash("sha256").update(`${data.email}|${data.message}`).digest("hex");
  const nowMs = Date.now();
  for (const [k, t] of seen) if (nowMs - t > 3_600_000) seen.delete(k);
  if (seen.has(fingerprint)) return quietOk();
  seen.set(fingerprint, nowMs);

  const settings = await getServerSettings();
  const notif = (settings.notifications ?? {}) as { leadEmailTo?: string; pushOnLead?: boolean };
  const teamTo = notif.leadEmailTo?.trim() || env.to;

  if (!convexReady && !(resendReady && teamTo)) {
    console.error("[contact] Nessun canale configurato (Convex / Resend).");
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
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
        locale: data.locale,
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
<p><b>Nume:</b> ${esc(data.name)}<br><b>E-mail:</b> ${esc(data.email)}<br><b>Telefon:</b> ${esc(data.phone ?? "—")}<br><b>Limba paginii:</b> ${esc((data.locale ?? "—").toUpperCase())}</p>
<p style="white-space:pre-wrap">${esc(data.message)}</p>`,
      });
      if (error) throw error;
      mailed = true;
    } catch (e) {
      console.error("[contact] Resend error", e);
    }
  }

  if (!stored && !mailed) {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }

  // Dopo la risposta: conferma al cliente e notifica push (non rallentano il form).
  after(async () => {
    if (resendReady) {
      const reply = contactReplyEmail(site.url, data.name, data.locale ?? "en");
      await resend()
        .emails.send({ from: env.from!, to: data.email, subject: reply.subject, html: reply.html, text: reply.text })
        .catch(() => undefined);
    }
    if (notif.pushOnLead !== false) {
      await notifyAdmins({ title: "Mesaj nou — winex.ro", body: `De la ${data.name}`, url: "/admin/mesaje" });
    }
  });

  return NextResponse.json({ ok: true });
}
