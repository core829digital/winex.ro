"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Download, Users } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { Badge, Btn, Card, ConfirmBtn, Empty, Field, Input, PageHeader, Skeleton, Stat, fmtDate } from "@/components/admin/ui";
import { errMsg, useToast } from "@/components/admin/toast";

type Status = Doc<"subscribers">["status"];
const TONE = { pending: "blue", subscribed: "green", unsubscribed: "gray", suppressed: "amber" } as const;
const LABEL = { pending: "În așteptare", subscribed: "Activ", unsubscribed: "Dezabonat", suppressed: "Blocat (bounce/reclamație)" } as const;

export default function NewsletterPage() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [q, setQ] = useState("");
  const list = useQuery(api.subscribers.list, filter === "all" ? {} : { status: filter });
  const stats = useQuery(api.subscribers.stats);
  const add = useMutation(api.subscribers.adminAdd);
  const setStatus = useMutation(api.subscribers.adminSetStatus);
  const remove = useMutation(api.subscribers.adminRemove);
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const rows = useMemo(() => (list ?? []).filter((s) => s.email.includes(q.trim().toLowerCase())), [list, q]);

  function exportCsv() {
    const body = ["email,status,sursa,data_cerere,data_confirmare", ...rows.map((s) => `${s.email},${s.status},${s.source},${new Date(s.subscribedAt).toISOString()},${s.confirmedAt ? new Date(s.confirmedAt).toISOString() : ""}`)].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `abonati-winex-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Newsletter" subtitle="Abonații din site (cu dublă confirmare). Primesc campanii doar cei activi: în așteptare, dezabonați și blocați sunt exclusi." actions={<Btn onClick={exportCsv} disabled={rows.length === 0}><Download size={16} /> Export CSV</Btn>} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Activi" value={stats?.subscribed ?? "–"} accent />
        <Stat label="În așteptare" value={stats?.pending ?? "–"} hint="nu au confirmat încă" />
        <Stat label="Dezabonați" value={stats?.unsubscribed ?? "–"} />
        <Stat label="Blocați" value={stats?.suppressed ?? "–"} hint="bounce / reclamație" />
      </div>

      <Card title="Adaugă manual" className="mt-4">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            add({ email, consentConfirmed: consent })
              .then(() => { toast("Abonat adăugat"); setEmail(""); setConsent(false); })
              .catch((err) => toast(errMsg(err), "error"));
          }}
        >
          <div className="flex-1"><Field label="E-mail"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@exemplu.ro" /></Field></div>
          <label className="flex items-center gap-2 text-sm text-ink-soft sm:pb-2.5">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="h-4 w-4 accent-[var(--red)]" />
            Persoana și-a dat consimțământul
          </label>
          <Btn variant="primary" type="submit" disabled={!consent}>Adaugă</Btn>
        </form>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["all", "subscribed", "pending", "unsubscribed", "suppressed"] as const).map((f) => (
          <Btn key={f} size="sm" variant={filter === f ? "primary" : "soft"} onClick={() => setFilter(f)}>
            {f === "all" ? "Toți" : LABEL[f].split(" ")[0]}
          </Btn>
        ))}
        <div className="ml-auto w-full sm:w-64"><Input placeholder="Caută e-mail…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Caută e-mail" /></div>
      </div>

      <div className="mt-3">
        {!list ? (
          <Skeleton className="h-48" />
        ) : rows.length === 0 ? (
          <Empty icon={<Users size={28} />} title="Niciun abonat" text="Abonații din formularul de pe site vor apărea aici." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-black/[0.07] text-xs uppercase tracking-[0.08em] text-ink-mute">
                <tr><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Stare</th><th className="px-4 py-3">Sursă</th><th className="px-4 py-3">Cerere / confirmare</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {rows.map((s) => (
                  <tr key={s._id}>
                    <td className="px-4 py-3 font-medium">{s.email}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[s.status]}>{LABEL[s.status]}</Badge></td>
                    <td className="px-4 py-3 text-ink-soft">{s.source}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.confirmedAt ? `Confirmat ${fmtDate(s.confirmedAt)}` : fmtDate(s.subscribedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex gap-2">
                        {s.status === "subscribed" && <Btn size="sm" onClick={() => setStatus({ id: s._id, status: "unsubscribed" }).catch((e) => toast(errMsg(e), "error"))}>Dezabonează</Btn>}
                        <ConfirmBtn label="Șterge" confirmLabel="Confirmă" onConfirm={() => remove({ id: s._id }).then(() => toast("Șters")).catch((e) => toast(errMsg(e), "error"))} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list && list.length >= 1000 && <p className="mt-2 text-xs text-ink-mute">Se afișează primii 1000 de abonați.</p>}
      </div>
    </>
  );
}
