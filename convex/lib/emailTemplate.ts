/**
 * Template email campagne (funzioni pure, usate sia da Convex per l'invio sia dall'anteprima in admin).
 * Il corpo usa un mini-markdown sicuro: paragrafi, # titolo, - elenchi, **grassetto**, [testo](https://link).
 */

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function safeUrl(u: string | undefined): string | null {
  if (!u) return null;
  try {
    const url = new URL(u.trim());
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function inline(src: string): string {
  let out = escapeHtml(src);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, href: string) => {
    const url = safeUrl(href.replace(/&amp;/g, "&"));
    return url
      ? `<a href="${escapeHtml(url)}" style="color:#b3131e;text-decoration:underline">${text}</a>`
      : text;
  });
  return out;
}

export function markdownToHtml(md: string): string {
  const blocks = md.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return blocks
    .map((b) => {
      const lines = b.split("\n");
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
        const items = lines.map((l) => `<li style="margin:4px 0">${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("");
        return `<ul style="margin:0 0 16px;padding-left:22px">${items}</ul>`;
      }
      if (/^#\s+/.test(b)) {
        return `<h2 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#25282d">${inline(b.replace(/^#\s+/, ""))}</h2>`;
      }
      return `<p style="margin:0 0 16px">${lines.map(inline).join("<br>")}</p>`;
    })
    .join("");
}

export function markdownToText(md: string): string {
  return md
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)")
    .replace(/^#\s+/gm, "");
}

import { emailStrings } from "./emailStrings";

export type EmailInput = {
  /** lingua del destinatario: determina il piè di pagina (default: en) */
  locale?: string;
  subject: string;
  preheader?: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
  siteUrl: string;
  companyLine?: string;
};

export function renderEmailHtml(i: EmailInput): string {
  const str = emailStrings(i.locale).campaign;
  const cta = safeUrl(i.ctaUrl);
  const button =
    cta && i.ctaLabel
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:#dc2430"><a href="${escapeHtml(cta)}" style="display:inline-block;padding:14px 28px;font-weight:700;font-size:15px;color:#ffffff;text-decoration:none;border-radius:999px">${escapeHtml(i.ctaLabel)}</a></td></tr></table>`
      : "";
  return `<!doctype html>
<html lang="${escapeHtml(i.locale ?? "en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(i.subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f6f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#25282d">
<span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;color:transparent">${escapeHtml(i.preheader ?? "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f7"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="padding:28px 32px 8px"><a href="${escapeHtml(i.siteUrl)}" style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#25282d;text-decoration:none">win<span style="color:#dc2430">ex</span></a></td></tr>
<tr><td style="padding:12px 32px 8px;font-size:16px;line-height:1.65;color:#4a5059">${markdownToHtml(i.body)}${button}</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #eeeff1;font-size:12px;line-height:1.6;color:#6f7681">
${i.companyLine ? `${escapeHtml(i.companyLine)}<br>` : ""}${escapeHtml(str.received)}<br>
<a href="${escapeHtml(i.unsubscribeUrl)}" style="color:#6f7681;text-decoration:underline">${escapeHtml(str.unsubscribe)}</a></td></tr>
</table></td></tr></table></body></html>`;
}

export function renderEmailText(i: EmailInput): string {
  const cta = safeUrl(i.ctaUrl);
  const str = emailStrings(i.locale).campaign;
  return [
    markdownToText(i.body),
    cta && i.ctaLabel ? `${i.ctaLabel}: ${cta}` : "",
    "—",
    i.companyLine ?? "",
    `${str.unsubscribe}: ${i.unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
