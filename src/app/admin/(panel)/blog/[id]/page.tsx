"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Btn, Card, ConfirmBtn, Field, Input, PageHeader, Skeleton, Textarea, inputCls } from "@/components/admin/ui";
import { errMsg, useToast } from "@/components/admin/toast";

export default function PostEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const doc = useQuery(api.posts.get, isNew ? "skip" : { id: id as Id<"posts"> });
  if (!isNew && doc === undefined) return <Skeleton className="h-96" />;
  if (!isNew && doc === null) return <p className="text-ink-soft">Articolul nu există.</p>;
  return <Editor key={doc?._id ?? "new"} id={isNew ? null : (id as Id<"posts">)} doc={doc ?? null} />;
}

function Editor({ id, doc }: { id: Id<"posts"> | null; doc: Doc<"posts"> | null }) {
  const router = useRouter();
  const toast = useToast();
  const save = useMutation(api.posts.save);
  const remove = useMutation(api.posts.remove);
  const [f, setF] = useState({
    title: doc?.title ?? "",
    slug: doc?.slug ?? "",
    excerpt: doc?.excerpt ?? "",
    content: doc?.content ?? "",
    coverUrl: doc?.coverUrl ?? "",
    seoTitle: doc?.seoTitle ?? "",
    seoDescription: doc?.seoDescription ?? "",
    status: (doc?.status ?? "draft") as "draft" | "published",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  return (
    <>
      <Link href="/admin/blog" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"><ArrowLeft size={16} /> Blog</Link>
      <PageHeader title={doc ? doc.title : "Articol nou"} />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card title="Conținut">
          <div className="space-y-4">
            <Field label="Titlu"><Input value={f.title} onChange={set("title")} maxLength={160} /></Field>
            <Field label="Rezumat"><Textarea rows={2} value={f.excerpt} onChange={set("excerpt")} maxLength={300} /></Field>
            <Field label="Conținut (Markdown)"><Textarea rows={18} value={f.content} onChange={set("content")} className="font-mono text-[13px]" /></Field>
          </div>
        </Card>
        <div className="space-y-4">
          <Card title="Publicare">
            <Field label="Stare">
              <select value={f.status} onChange={set("status")} className={inputCls}>
                <option value="draft">Ciornă</option>
                <option value="published">Publicat</option>
              </select>
            </Field>
            <p className="mt-2 text-xs text-ink-mute">Pagina publică /blog nu este încă activă: articolele rămân vizibile doar aici.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn
                variant="primary"
                onClick={() =>
                  save({ id: id ?? undefined, ...f })
                    .then((nid) => { toast("Salvat"); if (!id) router.replace(`/admin/blog/${nid}`); })
                    .catch((e) => toast(errMsg(e), "error"))
                }
              >
                Salvează
              </Btn>
              {doc && <ConfirmBtn size="md" label="Șterge" confirmLabel="Confirmă" onConfirm={() => remove({ id: doc._id }).then(() => router.replace("/admin/blog")).catch((e) => toast(errMsg(e), "error"))} />}
            </div>
          </Card>
          <Card title="SEO & imagine">
            <div className="space-y-4">
              <Field label="Slug (URL)" hint="Se generează din titlu dacă e gol."><Input value={f.slug} onChange={set("slug")} /></Field>
              <Field label="Imagine copertă (URL)"><Input value={f.coverUrl} onChange={set("coverUrl")} placeholder="https://…" /></Field>
              <Field label="Titlu SEO"><Input value={f.seoTitle} onChange={set("seoTitle")} maxLength={70} /></Field>
              <Field label="Descriere SEO"><Textarea rows={3} value={f.seoDescription} onChange={set("seoDescription")} maxLength={170} /></Field>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
