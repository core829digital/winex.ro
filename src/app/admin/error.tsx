"use client";

import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const denied = /FORBIDDEN|UNAUTHENTICATED/.test(error.message);
  return (
    <main className="grid min-h-dvh place-items-center bg-bg-soft p-6">
      <div className="max-w-md rounded-3xl border border-black/10 bg-white p-8">
        <h1 className="text-2xl font-extrabold">{denied ? "Acces refuzat" : "A apărut o eroare"}</h1>
        <p className="mt-3 text-ink-soft">
          {denied
            ? "Contul tău nu este autorizat pentru panoul de administrare."
            : "Nu am putut încărca pagina. Reîncearcă sau deconectează-te."}
        </p>
        <div className="mt-6 flex gap-3">
          {!denied && (
            <button onClick={reset} className="rounded-xl bg-red px-4 py-2.5 text-sm font-semibold text-white">
              Reîncearcă
            </button>
          )}
          <button onClick={() => void signOut().then(() => router.replace("/admin/login"))} className="rounded-xl bg-black/[0.06] px-4 py-2.5 text-sm font-semibold">
            Deconectare
          </button>
        </div>
      </div>
    </main>
  );
}
