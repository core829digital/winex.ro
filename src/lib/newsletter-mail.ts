/** Email transazionali della newsletter, nella lingua dell'iscritto (funzioni pure, testabili). Tutto l'input è escapato. */
import { emailStrings } from "../../convex/lib/emailStrings";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const base = (u: string) => u.replace(/\/$/, "");

const shell = (siteUrl: string, lang: string, inner: string, footer: string) => `<!doctype html>
<html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f6f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2328">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:10px;border:1px solid #e3e5e8">
<tr><td style="padding:28px 32px 4px"><a href="${esc(siteUrl)}" style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#1f2328;text-decoration:none">win<span style="color:#cc1f2b">ex</span></a></td></tr>
<tr><td style="padding:12px 32px 8px;font-size:16px;line-height:1.65;color:#454c55">${inner}</td></tr>
<tr><td style="padding:16px 32px 28px;border-top:1px solid #eeeff1;font-size:12px;line-height:1.6;color:#667085">${footer}</td></tr>
</table></td></tr></table></body></html>`;

export function confirmationUrl(siteUrl: string, token: string, locale: string) {
  return `${base(siteUrl)}/${encodeURIComponent(locale)}/confirm-subscription?t=${encodeURIComponent(token)}`;
}

/** Email di conferma (double opt-in). Il link porta a una pagina che richiede un click esplicito. */
export function confirmationEmail(siteUrl: string, token: string, locale: string) {
  const s = emailStrings(locale).confirm;
  const url = confirmationUrl(siteUrl, token, locale);
  const html = shell(
    siteUrl,
    locale,
    `<h2 style="margin:8px 0 12px;font-size:22px;line-height:1.25;color:#1f2328">${esc(s.heading)}</h2>
<p style="margin:0 0 16px">${esc(s.intro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px"><tr><td style="border-radius:6px;background:#cc1f2b"><a href="${esc(url)}" style="display:inline-block;padding:14px 28px;font-weight:700;font-size:15px;color:#ffffff;text-decoration:none;border-radius:6px">${esc(s.button)}</a></td></tr></table>
<p style="margin:0;font-size:13px;color:#667085">${esc(s.hint)}<br><span style="word-break:break-all">${esc(url)}</span></p>`,
    esc(s.ignore),
  );
  return { subject: s.subject, html, text: `${s.heading}\n\n${s.intro}\n${url}\n\n${s.hint}\n${s.ignore}` };
}

/** Email di benvenuto, inviata solo DOPO la conferma. Include la disiscrizione con un click. */
export function welcomeEmail(siteUrl: string, unsubToken: string, locale: string) {
  const s = emailStrings(locale).welcome;
  const root = base(siteUrl);
  const unsubPage = `${root}/${encodeURIComponent(locale)}/unsubscribe?t=${encodeURIComponent(unsubToken)}`;
  const html = shell(
    siteUrl,
    locale,
    `<h2 style="margin:8px 0 12px;font-size:22px;line-height:1.25;color:#1f2328">${esc(s.heading)}</h2><p style="margin:0 0 16px">${esc(s.body)}</p>`,
    `${esc(s.footerLead)} <a href="${esc(unsubPage)}" style="color:#667085;text-decoration:underline">${esc(s.unsubscribe)}</a>`,
  );
  return {
    subject: s.subject,
    html,
    text: `${s.heading}\n\n${s.body}\n\n${s.footerLead} ${unsubPage}`,
    headers: {
      "List-Unsubscribe": `<${root}/api/unsubscribe?t=${encodeURIComponent(unsubToken)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

/** Risposta automatica al cliente dopo il modulo contatti. */
export function contactReplyEmail(siteUrl: string, name: string, locale: string) {
  const s = emailStrings(locale).contactReply;
  const html = shell(siteUrl, locale, `<p style="margin:8px 0 12px">${esc(s.greeting(name))}</p><p style="margin:0 0 16px">${esc(s.body)}</p><p style="margin:0">${esc(s.signature)}</p>`, "");
  return { subject: s.subject, html, text: `${s.greeting(name)}\n\n${s.body}\n\n${s.signature}` };
}
