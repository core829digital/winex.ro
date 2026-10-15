import "server-only";
import { createHash } from "node:crypto";

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|bingpreview|curl|wget|python|axios|node-fetch|go-http|monitor|uptime/i;

export function isBot(ua: string | null): boolean {
  return !ua || BOT.test(ua);
}

export function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

/** Giorno e ora nel fuso Europe/Bucharest (chiavi dei contatori). */
export function bucharestKeys(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { day: `${get("year")}-${get("month")}-${get("day")}`, hour: get("hour") };
}

/** ID visitatore anonimo: hash giornaliero di IP+UA+sale. Non reversibile, non persistente, nessun cookie. */
export function visitorId(ip: string, ua: string, day: string, salt: string): string {
  return createHash("sha256").update(`${ip}|${ua}|${day}|${salt}`).digest("hex").slice(0, 16);
}
