"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Inbox, Mail, Phone } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { Badge, Btn, Card, ConfirmBtn, Empty, PageHeader, Skeleton, Textarea, fmtDate, timeAgo } from "@/components/admin/ui";
import { errMsg, useToast } from "@/components/admin/toast";

type Status = Doc<"leads">["status"];
const FILTERS: { id: Status | "all"; label: string }[] = [
  { id: "all", label: "Toate" },
  { id: "new", label: "Noi" },
  { id: "read", label: "Citite" },
  { id: "replied", label: "Răspunse" },
  { id: "archived", label: "Arhivate" },
];
const TONE = { new: "red", read: "gray", replied: "green", archived: "gray" } as const;
const LABEL = { new: "Nou", read: "Citit", replied: "Răspuns", archived: "Arhivat" } as const;

export default function MessagesPage() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const leads = useQuery(api.leads.list, filter === "all" ? {} : { status: filter });
  const [sel, setSel] = useState<string | null>(null);
  const setStatus = useMutation(api.leads.setStatus);
  const toast = useToast();

  const current = useMemo(() => leads?.find((l) => l._id === sel) ?? null, [leads, sel]);

  const open = (l: Doc<"leads">) => {
    setSel(l._id);
    if (l.status === "new") void setStatus({ id: l._id, status: "read" });
  };

  return (
    <>
      <PageHeader title="Mesaje" subtitle="Mesajele primite prin formularul de contact și configurator." />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Btn key={f.id} size="sm" variant={filter === f.id ? "primary" : "soft"} onClick={() => { setFilter(f.id); setSel(null); }}>
            {f.label}
          </Btn>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className={current ? "hidden lg:block" : ""}>
          {!leads ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : leads.length === 0 ? (
            <Empty icon={<Inbox size={28} />} title="Niciun mesaj" text="Mesajele din formularul de contact vor apărea aici, instantaneu." />
          ) : (
            <ul className="space-y-2">
              {leads.map((l) => (
                <li key={l._id}>
                  <button
                    onClick={() => open(l)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${sel === l._id ? "border-red/40 bg-red-soft/50" : "border-black/[0.07] bg-white hover:bg-black/[0.02]"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${l.status === "new" ? "font-extrabold" : "font-semibold"}`}>{l.name}</span>
                      <span className="shrink-0 text-xs text-ink-mute">{timeAgo(l.createdAt)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-ink-soft">{l.subject || l.message}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone={TONE[l.status]}>{LABEL[l.status]}</Badge>
                      {l.source === "configurator" && <Badge tone="blue">Configurator</Badge>}
                      {l.locale && <Badge>{l.locale.toUpperCase()}</Badge>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={current ? "" : "hidden lg:block"}>
          {current ? (
            <Detail lead={current} onBack={() => setSel(null)} onError={(e) => toast(errMsg(e), "error")} />
          ) : (
            <Empty title="Selectează un mesaj" text="Alege un mesaj din listă pentru a-l citi și a răspunde." />
          )}
        </div>
      </div>
    </>
  );
}

function Detail({ lead, onBack, onError }: { lead: Doc<"leads">; onBack: () => void; onError: (e: unknown) => void }) {
  const setStatus = useMutation(api.leads.setStatus);
  const setNote = useMutation(api.leads.setNote);
  const remove = useMutation(api.leads.remove);
  const toast = useToast();
  const [note, setNoteText] = useState(lead.note ?? "");
  const subject = encodeURIComponent(`Re: ${lead.subject || "Mesajul tău către Winex"}`);

  return (
    <Card>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink lg:hidden">
        <ArrowLeft size={16} /> Înapoi
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">{lead.name}</h2>
          <p className="mt-1 text-xs text-ink-mute">{fmtDate(lead.createdAt)}</p>
        </div>
        <Badge tone={TONE[lead.status]}>{LABEL[lead.status]}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`mailto:${lead.email}?subject=${subject}`} className="inline-flex items-center gap-2 rounded-xl bg-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-deep">
          <Mail size={16} /> Răspunde
        </a>
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-2 rounded-xl bg-black/[0.05] px-4 py-2.5 text-sm font-semibold hover:bg-black/[0.09]">
            <Phone size={16} /> {lead.phone}
          </a>
        )}
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">E-mail</dt><dd className="mt-1 break-all">{lead.email}</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">Subiect</dt><dd className="mt-1">{lead.subject || "—"}</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">Limba paginii</dt><dd className="mt-1">{lead.locale ? lead.locale.toUpperCase() : "—"} <span className="text-xs text-ink-mute">(răspunde în această limbă)</span></dd></div>
      </dl>

      <div className="mt-5 rounded-xl bg-bg-soft p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{lead.message}</p>
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft" htmlFor="note">Notă internă</label>
        <Textarea id="note" rows={3} value={note} onChange={(e) => setNoteText(e.target.value)} placeholder="Ex.: sunat luni, ofertă trimisă…" />
        <Btn size="sm" className="mt-2" disabled={note === (lead.note ?? "")} onClick={() => setNote({ id: lead._id, note }).then(() => toast("Notă salvată")).catch(onError)}>
          Salvează nota
        </Btn>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/[0.07] pt-4">
        {lead.status !== "replied" && <Btn size="sm" onClick={() => setStatus({ id: lead._id, status: "replied" }).catch(onError)}>Marchează „răspuns”</Btn>}
        {lead.status !== "archived" ? (
          <Btn size="sm" onClick={() => setStatus({ id: lead._id, status: "archived" }).catch(onError)}>Arhivează</Btn>
        ) : (
          <Btn size="sm" onClick={() => setStatus({ id: lead._id, status: "read" }).catch(onError)}>Redeschide</Btn>
        )}
        <ConfirmBtn label="Șterge" confirmLabel="Confirmă ștergerea" onConfirm={() => remove({ id: lead._id }).then(() => { toast("Mesaj șters"); onBack(); }).catch(onError)} />
      </div>
    </Card>
  );
}
