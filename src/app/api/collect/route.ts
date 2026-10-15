import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { api, convex, convexReady, env, guard } from "@/lib/server";
import { bucharestKeys, deviceOf, isBot, visitorId } from "@/lib/analytics";

export const runtime = "nodejs";

const schema = z.object({
  type: z.enum(["pv", "click"]),
  path: z
    .string()
    .max(200)
    .regex(/^\/[^\s?#]*$/)
    .refine((p) => !p.startsWith("/admin") && !p.startsWith("/api")),
  ref: z.string().max(100).optional(),
  label: z.string().max(80).optional(),
});

const noContent = () => new Response(null, { status: 204 });

export async function POST(req: Request) {
  const g = guard(req);
  if (!g.ok) return new Response(null, { status: 403 });
  const ua = req.headers.get("user-agent");
  if (isBot(ua) || !convexReady) return noContent();
  if (!rateLimit(`collect:${g.ip}`, 120, 60_000)) return new Response(null, { status: 429 });

  const text = await req.text();
  if (text.length > 1000) return noContent();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return noContent();
  }
  const p = schema.safeParse(json);
  if (!p.success) return noContent();

  const { day, hour } = bucharestKeys();
  const clean = (s?: string) => s?.replace(/[\u0000-\u001f]/g, "").trim() || undefined;
  try {
    await convex().mutation(api.analytics.record, {
      secret: env.ingestSecret!,
      type: p.data.type,
      day,
      hour,
      vid: visitorId(g.ip, ua!, day, env.analyticsSalt!),
      path: p.data.path,
      ref: clean(p.data.ref),
      device: deviceOf(ua!),
      country: req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? undefined,
      label: clean(p.data.label),
    });
  } catch (e) {
    console.error("[collect] Convex error", e);
  }
  return noContent();
}
