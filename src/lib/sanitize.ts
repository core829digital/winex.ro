/**
 * Sanitizzazione e rilevamento di input ostile (puro, senza dipendenze: usato da server e test).
 * L'output verso HTML passa comunque sempre da `esc()` / React; qui si riduce la superficie d'attacco a monte.
 */

// Caratteri di controllo (tranne \t \n \r), zero-width e override bidirezionali (spoofing visivo).
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const INVISIBLE = /[​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
const TAG = /<\/?[a-z!?][^>]*>/gi;

function base(s: string): string {
  return s.normalize("NFKC").replace(CONTROL, "").replace(INVISIBLE, "").replace(/\r\n?/g, "\n").replace(TAG, "").replace(/[<>]/g, "");
}

/** Testo su una riga (nome, oggetto, telefono, email): niente a-capo, spazi collassati. Impedisce header injection. */
export function sanitizeLine(s: string): string {
  return base(s).replace(/\s+/g, " ").trim();
}

/** Testo multi-riga (messaggio): conserva i paragrafi, max una riga vuota consecutiva. */
export function sanitizeBlock(s: string): string {
  return base(s)
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Tentativi evidenti di XSS / injection nell'input GREZZO (prima della sanitizzazione). */
const HOSTILE: RegExp[] = [
  /<\s*\/?\s*(?:script|iframe|object|embed|svg|img|style|link|meta|form|base|math|video|audio|body|html)\b/i,
  /\b(?:javascript|vbscript)\s*:/i,
  /\bdata\s*:\s*text\/html/i,
  /\bon(?:error|load|click|mouse\w+|focus|blur|submit|key\w+|change|input|toggle|animation\w+|pointer\w+)\s*=/i,
  /(?:\{\{|\}\}|\$\{|<%|%>)/,
  /\b(?:union\s+select|drop\s+table|insert\s+into|;\s*--|\bor\s+1\s*=\s*1\b)/i,
  /(?:\.\.\/){2,}|%2e%2e%2f/i,
  /(?:^|\n)\s*(?:bcc|cc|to|content-type|mime-version)\s*:/i, // header injection nei campi di testo
];

export function looksHostile(raw: string): boolean {
  return HOSTILE.some((re) => re.test(raw));
}

const SPAM_WORDS = /\b(?:viagra|cialis|casino|porn\w*|escort|bitcoin|crypto(?:currency)?|forex|backlinks?|payday\s+loans?|seo\s+(?:services?|expert)|click\s+here|buy\s+followers)\b/i;

/** Spam "da modulo": troppi link, parole tipiche, ripetizioni o testo senza lettere. */
export function looksSpammy(text: string): boolean {
  const links = (text.match(/https?:\/\/|www\.|\b[a-z0-9-]+\.(?:ru|top|xyz|click|loan|work)\b/gi) ?? []).length;
  if (links > 2) return true;
  if (SPAM_WORDS.test(text)) return true;
  if (/(.)\1{24,}/.test(text)) return true; // stesso carattere 25+ volte
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  if (text.length >= 20 && letters / text.length < 0.4) return true;
  return false;
}
