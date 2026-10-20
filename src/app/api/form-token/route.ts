import { NextResponse } from "next/server";
import { issueFormToken } from "@/lib/form-token";
import { rateLimit } from "@/lib/rate-limit";
import { guardStrict } from "@/lib/server";

export const runtime = "nodejs";

/** Rilascia un token firmato e a scadenza per il modulo contatti (vedi lib/form-token). */
export async function GET(req: Request) {
  const g = guardStrict(req, { requireOrigin: false });
  if (!g.ok) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  if (!rateLimit(`token:${g.ip}`, 30, 10 * 60_000))
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Cache-Control": "no-store" } });

  const token = issueFormToken(req.headers.get("user-agent") ?? "");
  if (!token) return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
}
