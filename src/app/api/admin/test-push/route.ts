import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@convex/_generated/api";
import { notifyAdmins } from "@/lib/push";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Invia una notifica push di prova ai dispositivi admin. Richiede sessione admin valida. */
export async function POST() {
  try {
    const token = await convexAuthNextjsToken();
    await fetchQuery(api.team.whoami, {}, { token }); // lancia se non autenticato / non admin
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!rateLimit("test-push", 10, 60_000)) return NextResponse.json({ error: "rate" }, { status: 429 });
  await notifyAdmins({ title: "Test notificări — Winex Admin", body: "Notificările push funcționează.", url: "/admin/notificari" });
  return NextResponse.json({ ok: true });
}
