/**
 * Le mutation sono pubbliche per definizione in Convex: per evitare che chiunque
 * possa scrivere nel database, ogni scrittura richiede un segreto condiviso con il
 * server Next.js (variabile INGEST_SECRET impostata in Convex).
 */
export function assertIngestSecret(secret: string) {
  const expected = process.env.INGEST_SECRET;
  if (!expected || expected.length < 16) {
    throw new Error("INGEST_SECRET non configurato in Convex");
  }
  if (secret.length !== expected.length) throw new Error("Unauthorized");
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ secret.charCodeAt(i);
  if (diff !== 0) throw new Error("Unauthorized");
}
