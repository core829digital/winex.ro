/** Email transazionali della newsletter (funzioni pure, testabili). Tutto l'input è escapato. */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const shell = (siteUrl: string, inner: string, footer: string) => `<!doctype html>
<html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f6f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#25282d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px">
<tr><td style="padding:28px 32px 4px"><a href="${esc(siteUrl)}" style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#25282d;text-decoration:none">win<span style="color:#dc2430">ex</span></a></td></tr>
<tr><td style="padding:12px 32px 8px;font-size:16px;line-height:1.65;color:#4a5059">${inner}</td></tr>
<tr><td style="padding:16px 32px 28px;border-top:1px solid #eeeff1;font-size:12px;line-height:1.6;color:#6f7681">${footer}</td></tr>
</table></td></tr></table></body></html>`;

export function confirmationUrl(siteUrl: string, token: string) {
  return `${siteUrl.replace(/\/$/, "")}/confirma-abonare?t=${encodeURIComponent(token)}`;
}

/** Email di conferma (double opt-in). Il link porta a una pagina che richiede un click esplicito. */
export function confirmationEmail(siteUrl: string, token: string) {
  const url = confirmationUrl(siteUrl, token);
  const html = shell(
    siteUrl,
    `<h2 style="margin:8px 0 12px;font-size:22px;line-height:1.25;color:#25282d">Confirmă abonarea</h2>
<p style="margin:0 0 16px">Ai cerut să primești newsletterul Winex. Apasă butonul de mai jos pentru a confirma adresa de e-mail.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px"><tr><td style="border-radius:999px;background:#dc2430"><a href="${esc(url)}" style="display:inline-block;padding:14px 28px;font-weight:700;font-size:15px;color:#ffffff;text-decoration:none;border-radius:999px">Confirmă abonarea</a></td></tr></table>
<p style="margin:0;font-size:13px;color:#6f7681">Linkul este valabil 7 zile. Dacă butonul nu funcționează, copiază în browser: <br><span style="word-break:break-all">${esc(url)}</span></p>`,
    "Dacă nu ai cerut tu această abonare, ignoră acest mesaj: nu vei primi nimic și adresa ta va fi ștearsă automat.",
  );
  const text = `Confirmă abonarea la newsletterul Winex:\n${url}\n\nLinkul este valabil 7 zile. Dacă nu ai cerut tu abonarea, ignoră acest mesaj.`;
  return { subject: "Confirmă abonarea la newsletterul Winex", html, text };
}

/** Email di benvenuto, inviata solo DOPO la conferma. Include la disiscrizione con un click. */
export function welcomeEmail(siteUrl: string, unsubToken: string) {
  const base = siteUrl.replace(/\/$/, "");
  const unsubPage = `${base}/dezabonare?t=${encodeURIComponent(unsubToken)}`;
  const html = shell(
    siteUrl,
    `<h2 style="margin:8px 0 12px;font-size:22px;line-height:1.25;color:#25282d">Bine ai venit!</h2>
<p style="margin:0 0 16px">Abonarea ta a fost confirmată. Îți vom trimite noutăți despre produse, proiecte și oferte Winex.</p>`,
    `Te poți dezabona oricând: <a href="${esc(unsubPage)}" style="color:#6f7681;text-decoration:underline">Dezabonează-te</a>`,
  );
  return {
    subject: "Bine ai venit la Winex",
    html,
    text: `Abonarea ta la newsletterul Winex a fost confirmată.\n\nDezabonare: ${unsubPage}`,
    headers: {
      "List-Unsubscribe": `<${base}/api/unsubscribe?t=${encodeURIComponent(unsubToken)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
