"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { FileText, Plus } from "lucide-react";
import { api } from "@convex/_generated/api";
import { Badge, Card, Empty, PageHeader, Skeleton, fmtDate } from "@/components/admin/ui";

export default function BlogPage() {
  const posts = useQuery(api.posts.list);
  return (
    <>
      <PageHeader
        title="Blog"
        subtitle="Pregătit pentru viitor: poți scrie articole acum; pagina publică /blog nu este încă activă."
        actions={<Link href="/admin/blog/new" className="inline-flex items-center gap-2 rounded-xl bg-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-deep"><Plus size={16} /> Articol nou</Link>}
      />
      {!posts ? (
        <Skeleton className="h-40" />
      ) : posts.length === 0 ? (
        <Empty icon={<FileText size={28} />} title="Niciun articol" text="Creează primul articol. Rămâne invizibil pe site până la activarea paginii publice." />
      ) : (
        <div className="grid gap-3">
          {posts.map((p) => (
            <Link key={p._id} href={`/admin/blog/${p._id}`}>
              <Card className="transition-colors hover:bg-black/[0.015]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold">{p.title}</p>
                    <p className="truncate text-sm text-ink-soft">{p.locale.toUpperCase()} · /{p.slug} · {fmtDate(p.updatedAt)}</p>
                  </div>
                  <Badge tone={p.status === "published" ? "green" : "gray"}>{p.status === "published" ? "Publicat" : "Ciornă"}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
