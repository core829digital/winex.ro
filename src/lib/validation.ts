import { z } from "zod";

const clean = (max: number) => z.string().trim().max(max);

export const contactSchema = z.object({
  name: clean(120).min(2, "Introdu numele tău."),
  email: clean(254).pipe(z.email("Adresa de e-mail nu este validă.")),
  phone: clean(30)
    .regex(/^[+()\d\s./-]{6,30}$/, "Număr de telefon invalid.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  subject: clean(160).optional(),
  message: clean(4000).min(10, "Mesajul este prea scurt."),
  consent: z.literal(true, { error: "Trebuie să accepți prelucrarea datelor." }),
  /** honeypot: i bot lo compilano, gli umani non lo vedono */
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: clean(254).pipe(z.email("Adresa de e-mail nu este validă.")),
  consent: z.literal(true, { error: "Trebuie să accepți condițiile." }),
  website: z.string().max(0).optional(),
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;
