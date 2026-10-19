/**
 * Auto-ridimensionamento dell'iframe OneSpec.
 * Si accettano SOLO messaggi provenienti dall'origine OneSpec, di tipo "onespec:resize", con il publicId
 * del nostro configuratore e un'altezza numerica valida. Qualsiasi altro messaggio viene ignorato.
 * Ritorna l'altezza in px oppure null se il messaggio non è valido.
 */
export function parseOneSpecResize(eventOrigin: string, data: unknown, publicId: string, allowedOrigin: string): number | null {
  if (eventOrigin !== allowedOrigin) return null;
  if (typeof data !== "object" || data === null) return null;
  const d = data as { type?: unknown; publicId?: unknown; height?: unknown };
  if (d.type !== "onespec:resize" || d.publicId !== publicId) return null;
  if (typeof d.height !== "number" || !Number.isFinite(d.height) || d.height <= 0) return null;
  return Math.min(Math.round(d.height), 20000); // limite di sicurezza
}
