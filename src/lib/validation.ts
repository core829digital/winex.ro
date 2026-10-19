import { z } from "zod";
import { locales } from "@/i18n/routing";

/**
 * I messaggi di errore sono CODICI stabili (non testo): la UI li traduce con forms.errors.<codice>.
 */
const clean = (max: number) => z.string().trim().max(max);
const localeField = z.enum(locales).optional();

export const contactSchema = z.object({
  name: clean(120).min(2, "invalid_name"),
  email: clean(254).pipe(z.email("invalid_email")),
  phone: clean(30)
    .regex(/^[+()\d\s./-]{6,30}$/, "invalid_phone")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  subject: clean(160).optional(),
  message: clean(4000).min(10, "invalid_message"),
  consent: z.literal(true, { error: "consent_required" }),
  locale: localeField,
  /** honeypot: i bot lo compilano, gli umani no. Non si rifiuta: la route risponde "ok" senza fare nulla. */
  website: z.string().max(500).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: clean(254).pipe(z.email("invalid_email")),
  consent: z.literal(true, { error: "consent_required" }),
  locale: localeField,
  website: z.string().max(500).optional(),
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;
