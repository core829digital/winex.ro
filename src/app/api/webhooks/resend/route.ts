import { NextResponse } from "next/server";
import { api, convex, convexReady, env } from "@/lib/server";
import { verifySvix } from "@/lib/svix";

export const runtime = "nodejs";

type ResendEvent = {
  type: string;
  data?: {
    to?: string[] | string;
    tags?: Record<string, string> | { name: string; value: string }[];
    click?: { link?: string };
  };
};

const MAP: Record<string, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

export async function POST(req: Request) {
  if (!env.webhookSecret || !convexReady) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const body = await req.text();
  if (body.length > 100_000 || !verifySvix(body, req.headers, env.webhookSecret))
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  let ev: ResendEvent;
  try {
    ev = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const type = MAP[ev.type];
  if (!type) return NextResponse.json({ ok: true });

  const tags = ev.data?.tags;
  const campaignId = Array.isArray(tags) ? tags.find((t) => t.name === "campaign_id")?.value : tags?.campaign_id;
  const to = Array.isArray(ev.data?.to) ? ev.data!.to[0] : ev.data?.to;
  if (!to) return NextResponse.json({ ok: true });

  try {
    const client = convex();
    if (campaignId) {
      await client.mutation(api.campaigns.recordEvent, {
        secret: env.ingestSecret!,
        campaignId,
        email: to,
        type,
        link: ev.data?.click?.link,
      });
    }
    if (type === "bounced" || type === "complained") {
      await client.mutation(api.subscribers.suppressByEmail, { secret: env.ingestSecret!, email: to });
    }
  } catch (e) {
    console.error("[resend-webhook] Convex error", e);
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
