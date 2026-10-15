import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { api, convex, convexReady, env } from "@/lib/server";

export const runtime = "nodejs";

/** Disiscrizione (anche one-click RFC 8058 dai client email). Il token è nel link dell'email. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`unsub:${ip}`, 20, 10 * 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const url = new URL(req.url);
  let token = url.searchParams.get("t");
  if (!token) {
    try {
      token = ((await req.json()) as { token?: string }).token ?? null;
    } catch {}
  }
  if (!token || !convexReady) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const r = await convex().mutation(api.subscribers.unsubscribeByToken, { secret: env.ingestSecret!, token });
    return NextResponse.json(r, { status: r.ok ? 200 : 404 });
  } catch (e) {
    console.error("[unsubscribe] Convex error", e);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
