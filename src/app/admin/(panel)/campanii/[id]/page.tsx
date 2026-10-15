"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Send, TestTube2 } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { renderEmailHtml } from "@convex/lib/emailTemplate";
import { Badge, Btn, Card, ConfirmBtn, Field, Input, PageHeader, Skeleton, Stat, Textarea, fmtDate } from "@/components/admin/ui";
import { errMsg, useToast } from "@/components/admin/toast";
import { STATUS_LABEL, STATUS_TONE } from "@/components/admin/campaign-status";

export default function CampaignEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const doc = useQuery(api.campaigns.get, isNew ? "skip" : { id: id as Id<"campaigns"> });
  if (!isNew && doc === undefined) return <Skeleton className="h-96" />;
  if (!isNew && doc === null) return <p className="text-ink-soft">Campania nu există.</p>;
  return <Editor key={doc?._id ?? "new"} id={isNew ? null : (id as Id<"campaigns">)} doc={doc ?? null} />;
}

function Editor({ id, doc }: { id: Id<"campaigns"> | null; doc: Doc<"campaigns"> | null }) {
  const router = useRouter();
  const toast = useToast();
  const save = useMutation(api.campaigns.save);
  const remove = useMutation(api.campaigns.remove);
  const sendTest = useMutation(api.campaigns.sendTest);
  const send = useMutation(api.campaigns.send);
  const unschedule = useMutation(api.campaigns.cancelSchedule);
  const active = useQuery(api.subscribers.activeCount);

  const locked = !!doc && doc.status !== "draft" && doc.status !== "failed";
  const [f, setF] = useState({
    name: doc?.name ?? "",
    subject: doc?.subject ?? "",
    preheader: doc?.preheader ?? "",
    body: doc?.body ?? "Bună ziua,\n\nScrie aici mesajul tău. Poți folosi **text îngroșat**, [linkuri](https://winex.ro) și liste:\n\n- primul punct\n- al doilea punct",
    ctaLabel: doc?.ctaLabel ?? "",
    ctaUrl: doc?.ctaUrl ?? "",
  });
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const html = useMemo(
    () => renderEmailHtml({ subject: f.subject, preheader: f.preheader, body: f.body, ctaLabel: f.ctaLabel, ctaUrl: f.ctaUrl, unsubscribeUrl: "#", siteUrl: "https://www.winex.ro", companyLine: "Winex · Roman, România" }),
    [f],
  );

  const persist = async () => {
    setBusy(true);
    try {
      const nid = await save({ id: id ?? undefined, name: f.name || f.subject || "Campanie fără nume", subject: f.subject, preheader: f.preheader, body: f.body, ctaLabel: f.ctaLabel, ctaUrl: f.ctaUrl });
      toast("Salvat");
      if (!id) router.replace(`/admin/campanii/${nid}`);
      return nid;
    } catch (e) {
      toast(errMsg(e), "error");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const s = doc?.stats;
  const pct = (n: number) => (s && s.delivered > 0 ? `${Math.round((n / s.delivered) * 100)}%` : "–");

  return (
    <>
      <Link href="/admin/campanii" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"><ArrowLeft size={16} /> Campanii</Link>
      <PageHeader
        title={doc ? doc.name : "Campanie nouă"}
        actions={doc && <Badge tone={STATUS_TONE[doc.status]}>{STATUS_LABEL[doc.status]}</Badge>}
      />

      {doc?.status === "failed" && <p role="alert" className="mb-4 rounded-xl bg-red-soft px-4 py-3 text-sm font-medium text-red-deep">Trimiterea a eșuat: {doc.error}. Poți corecta și retrimite (destinatarii deja serviți au primit mesajul; verifică statisticile).</p>}
      {doc?.status === "scheduled" && doc.scheduledAt && (
        <p className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800">
          Programată pentru {fmtDate(doc.scheduledAt)}.
          <Btn size="sm" onClick={() => unschedule({ id: doc._id }).then(() => toast("Programare anulată")).catch((e) => toast(errMsg(e), "error"))}>Anulează programarea</Btn>
        </p>
      )}

      {s && doc && (doc.status === "sent" || doc.status === "sending" || s.sent > 0) && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Trimise" value={s.sent} />
          <Stat label="Livrate" value={s.delivered} />
          <Stat label="Deschise" value={pct(s.opened)} hint={`${s.opened} unice`} accent />
          <Stat label="Click-uri" value={pct(s.clicked)} hint={`${s.clicked} unice`} accent />
          <Stat label="Respinse" value={s.bounced} />
          <Stat label="Reclamații" value={s.complained} />
        </div>
      )}
      {s && s.sent > 0 && <p className="mb-4 text-xs text-ink-mute">Statisticile de deschidere/click necesită webhook-ul Resend activ și urmărirea activată pe domeniu (vezi README). Deschiderile pot fi subestimate (blocare imagini/Apple Mail).</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Conținut">
          <div className="space-y-4">
            <Field label="Nume intern"><Input value={f.name} onChange={set("name")} disabled={locked} placeholder="Ex.: Ofertă toamnă 2026" /></Field>
            <Field label="Subiect e-mail"><Input value={f.subject} onChange={set("subject")} disabled={locked} maxLength={200} placeholder="Subiectul văzut de destinatar" /></Field>
            <Field label="Text de previzualizare" hint="Apare lângă subiect în inbox."><Input value={f.preheader} onChange={set("preheader")} disabled={locked} maxLength={200} /></Field>
            <Field label="Mesaj" hint="Paragrafe separate prin rând gol · # Titlu · **îngroșat** · [text](https://link) · liste cu „- ”."><Textarea rows={12} value={f.body} onChange={set("body")} disabled={locked} className="font-mono text-[13px]" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Text buton (opțional)"><Input value={f.ctaLabel} onChange={set("ctaLabel")} disabled={locked} placeholder="Configurează acum" /></Field>
              <Field label="Link buton"><Input value={f.ctaUrl} onChange={set("ctaUrl")} disabled={locked} placeholder="https://www.winex.ro/configurator" /></Field>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Previzualizare">
            <iframe title="Previzualizare e-mail" sandbox="" srcDoc={html} className="h-[520px] w-full rounded-xl border border-black/[0.08] bg-white" />
          </Card>

          <Card title="Trimitere">
            <div className="flex flex-wrap items-center gap-2">
              {!locked && <Btn variant="soft" onClick={() => void persist()} disabled={busy}>Salvează</Btn>}
              {doc && (
                <Btn
                  onClick={async () => {
                    if (!locked && (await persist()) === null) return;
                    sendTest({ id: doc._id }).then(() => toast("Test în curs de trimitere…", "info")).catch((e) => toast(errMsg(e), "error"));
                  }}
                >
                  <TestTube2 size={16} /> Trimite test către mine
                </Btn>
              )}
            </div>
            {doc?.testNote && <p className="mt-2 text-xs text-ink-soft">{doc.testNote}</p>}

            {doc && !locked && (
              <div className="mt-5 border-t border-black/[0.07] pt-4">
                <p className="text-sm text-ink-soft">Destinatari: <b className="text-ink">{active ?? "…"}</b> abonați activi. Cei dezabonați sau blocați sunt excluși automat.</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <Field label="Programează (opțional)"><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></Field>
                  <ConfirmBtn
                    size="md"
                    label={<span className="inline-flex items-center gap-2"><Send size={16} />{when ? "Programează" : "Trimite acum"}</span>}
                    confirmLabel={`Confirm: ${active ?? 0} destinatari`}
                    onConfirm={async () => {
                      if ((await persist()) === null) return;
                      send({ id: doc._id, at: when ? new Date(when).getTime() : undefined })
                        .then(() => toast(when ? "Campanie programată" : "Trimitere pornită"))
                        .catch((e) => toast(errMsg(e), "error"));
                    }}
                  />
                </div>
                {!when && <p className="mt-2 text-xs text-ink-mute">Trimiterea imediată nu poate fi anulată.</p>}
              </div>
            )}
            {doc && doc.status === "draft" && (
              <div className="mt-4"><ConfirmBtn label="Șterge campania" confirmLabel="Confirmă ștergerea" onConfirm={() => remove({ id: doc._id }).then(() => router.replace("/admin/campanii")).catch((e) => toast(errMsg(e), "error"))} /></div>
            )}
            {!doc && <p className="mt-3 text-xs text-ink-mute">Salvează ciorna pentru a putea trimite un test și pentru a programa campania.</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
