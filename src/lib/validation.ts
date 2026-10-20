import { z } from "zod";
import { locales } from "@/i18n/routing";
import { sanitizeBlock, sanitizeLine } from "./sanitize";

/**
 * I messaggi di errore sono CODICI stabili (non testo): la UI li traduce con forms.errors.<codice>.
 */
const clean = (max: number) => z.string().trim().max(max);
const localeField = z.enum(locales).optional();

/** Stringa → sanitizzata → poi validata (i limiti si applicano al testo già ripulito). */
const line = (max: number) => z.string().max(max * 2).transform(sanitizeLine);
const NAME_FORBIDDEN = /[<>@\/{}[\]$`|^~=*#%]|https?:|www\./i;

export const contactSchema = z.object({
  name: line(120).pipe(z.string().min(2, "invalid_name").max(120, "invalid_name").refine((v) => !NAME_FORBIDDEN.test(v), "invalid_name")),
  email: line(254).pipe(z.string().max(254, "invalid_email").toLowerCase().pipe(z.email("invalid_email"))),
  phone: line(30)
    .pipe(z.string().regex(/^[+()\d\s./-]{6,30}$/, "invalid_phone"))
    .optional()
    .or(z.literal("").transform(() => undefined)),
  subject: line(160).pipe(z.string().max(160)).optional(),
  message: z.string().max(8000).transform(sanitizeBlock).pipe(z.string().min(10, "invalid_message").max(4000, "invalid_message")),
  consent: z.literal(true, { error: "consent_required" }),
  locale: localeField,
  /** honeypot: i bot lo compilano, gli umani no. Non si rifiuta: la route risponde "ok" senza fare nulla. */
  website: z.string().max(500).optional(),
  /** token firmato rilasciato da /api/form-token (vedi lib/form-token). */
  ft: z.string().max(300).optional(),
  /** risposta Cloudflare Turnstile (solo se attivo). */
  turnstile: z.string().max(2048).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: clean(254).pipe(z.email("invalid_email")),
  consent: z.literal(true, { error: "consent_required" }),
  locale: localeField,
  website: z.string().max(500).optional(),
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;
