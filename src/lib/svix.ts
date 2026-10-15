import { createHmac, timingSafeEqual } from "node:crypto";

/** Verifica firma Svix (usata da Resend): HMAC-SHA256 di `${id}.${timestamp}.${body}` con segreto "whsec_…". */
export function verifySvix(body: string, headers: Headers, secret: string, now = Date.now()): boolean {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !ts || !sigHeader) return false;
  if (Math.abs(now / 1000 - Number(ts)) > 5 * 60) return false; // anti-replay
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest();
  return sigHeader.split(" ").some((part) => {
    const [ver, sig] = part.split(",");
    if (ver !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

