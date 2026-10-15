"use client";

import { useQuery } from "convex/react";
import { Check, ShieldCheck } from "lucide-react";
import { api } from "@convex/_generated/api";
import { Badge, Card, PageHeader, Skeleton, fmtDate } from "@/components/admin/ui";

export default function SecurityPage() {
  const t = useQuery(api.team.overview);
  return (
    <>
      <PageHeader title="Securitate" subtitle="Cine are acces la panou și ce s-a întâmplat recent." />
      {!t ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Administratori autorizați">
            <ul className="space-y-2">
              {t.admins.map((a) => (
                <li key={a.email} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{a.email}{a.email === t.me && " (tu)"}</span>
                  <Badge tone={a.hasSignedIn ? "green" : "gray"}>{a.hasSignedIn ? "a intrat" : "încă nu"}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-mute">
              Lista se modifică doar din setările Convex (variabila <code>ADMIN_EMAILS</code>), nu din acest panou — ca să nu poată fi extinsă accidental sau de un cont compromis.
            </p>
          </Card>
          <Card title="Protecții active">
            <ul className="space-y-2 text-sm text-ink-soft">
              {[
                "Autentificare cu cod unic pe e-mail (valabil 10 min, nu există parole)",
                "Doar adresele din listă primesc cod; verificare repetată la fiecare operațiune",
                "Sesiune max. 7 zile, expiră după 12 ore de inactivitate",
                "Încercări de cod limitate automat",
                "Panou ne-indexabil, fără cache, cu antete de securitate",
              ].map((x) => (
                <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{x}</li>
              ))}
            </ul>
          </Card>
          <Card title="Jurnal activitate" className="lg:col-span-2" action={<ShieldCheck size={18} className="text-ink-mute" />}>
            {t.log.length === 0 ? (
              <p className="text-sm text-ink-mute">Nicio acțiune sensibilă înregistrată încă.</p>
            ) : (
              <ul className="divide-y divide-black/[0.06] text-sm">
                {t.log.map((l) => (
                  <li key={l._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span><b>{l.action}</b>{l.target && <span className="text-ink-soft"> · {l.target}</span>}</span>
                    <span className="text-xs text-ink-mute">{l.actor} · {fmtDate(l.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
