"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Plus, Send } from "lucide-react";
import { api } from "@convex/_generated/api";
import { STATUS_LABEL, STATUS_TONE } from "@/components/admin/campaign-status";
import { Badge, Card, Empty, PageHeader, Skeleton, fmtDate } from "@/components/admin/ui";

export default function CampaignsPage() {
  const list = useQuery(api.campaigns.list);
  return (
    <>
      <PageHeader
        title="Campanii e-mail"
        subtitle="Creează și trimite e-mailuri de marketing către abonații activi."
        actions={<Link href="/admin/campanii/new" className="inline-flex items-center gap-2 rounded-xl bg-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-deep"><Plus size={16} /> Campanie nouă</Link>}
      />
      {!list ? (
        <Skeleton className="h-48" />
      ) : list.length === 0 ? (
        <Empty icon={<Send size={28} />} title="Nicio campanie încă" text="Creează prima campanie, trimite un test către tine și apoi către abonați." />
      ) : (
        <div className="grid gap-3">
          {list.map((c) => {
            const s = c.stats;
            const pct = (n: number) => (s.delivered > 0 ? `${Math.round((n / s.delivered) * 100)}%` : "–");
            return (
              <Link key={c._id} href={`/admin/campanii/${c._id}`}>
                <Card className="transition-colors hover:bg-black/[0.015]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-bold">{c.name}</p>
                      <p className="truncate text-sm text-ink-soft">{c.subject}</p>
                    </div>
                    <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-mute">
                    <span>{c.status === "scheduled" && c.scheduledAt ? `Programată: ${fmtDate(c.scheduledAt)}` : c.sentAt ? `Trimisă: ${fmtDate(c.sentAt)}` : `Modificată: ${fmtDate(c.updatedAt)}`}</span>
                    {s.sent > 0 && (
                      <>
                        <span>{s.sent} trimise</span>
                        <span>deschideri {pct(s.opened)}</span>
                        <span>click-uri {pct(s.clicked)}</span>
                      </>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
