"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  Bell,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  PenSquare,
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "@convex/_generated/api";
import { Logo } from "@/components/ui/Logo";
import { Skeleton } from "./ui";
import { useToast } from "./toast";

const items = [
  { href: "/admin", label: "Panou", icon: LayoutDashboard, exact: true },
  { href: "/admin/mesaje", label: "Mesaje", icon: Inbox, badge: true },
  { href: "/admin/newsletter", label: "Newsletter", icon: Users },
  { href: "/admin/campanii", label: "Campanii e-mail", icon: Send },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/continut", label: "Conținut site", icon: PenSquare },
  { href: "/admin/notificari", label: "Notificări", icon: Bell },
  { href: "/admin/securitate", label: "Securitate", icon: ShieldCheck },
] as const;

const SOUND_KEY = "winex-admin-sound";

function beep() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1175, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 700);
  } catch {}
}

/** Notifica in tempo reale: toast + suono + titolo scheda quando arriva un nuovo messaggio. */
function LiveLeadNotifier() {
  const data = useQuery(api.leads.newCount);
  const toast = useToast();
  const seen = useRef<number | null>(null);

  useEffect(() => {
    if (!data) return;
    document.title = data.count > 0 ? `(${data.count}) Winex Admin` : "Winex Admin";
    if (seen.current === null) {
      seen.current = data.latestAt; // primo caricamento: nessuna notifica
      return;
    }
    if (data.latestAt > seen.current) {
      seen.current = data.latestAt;
      toast(`Mesaj nou de la ${data.latestName ?? "un vizitator"}`, "info");
      let soundOn = true;
      try {
        soundOn = localStorage.getItem(SOUND_KEY) !== "off";
      } catch {}
      if (soundOn) beep();
      if (document.hidden && "Notification" in window && Notification.permission === "granted") {
        new Notification("Mesaj nou — winex.ro", { body: `De la ${data.latestName ?? "un vizitator"}`, icon: "/admin-icon-192.png" });
      }
    }
  }, [data, toast]);
  return null;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const path = usePathname();
  const { signOut } = useAuthActions();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/admin/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-dvh bg-bg-soft p-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="mt-6 h-64 w-full max-w-3xl" />
      </div>
    );
  }
  return <Authed path={path} open={open} setOpen={setOpen} onSignOut={() => void signOut().then(() => router.replace("/admin/login"))}>{children}</Authed>;
}

function Authed({
  children,
  path,
  open,
  setOpen,
  onSignOut,
}: {
  children: ReactNode;
  path: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  onSignOut: () => void;
}) {
  const me = useQuery(api.team.whoami); // lancia errore (→ error.tsx) se la sessione non è admin autorizzato
  const newCount = useQuery(api.leads.newCount);
  const active = (i: (typeof items)[number]) => ("exact" in i && i.exact ? path === i.href : path.startsWith(i.href));

  const nav = (
    <nav aria-label="Navigare admin" className="flex flex-col gap-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          onClick={() => setOpen(false)}
          aria-current={active(i) ? "page" : undefined}
          className={clsx(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
            active(i) ? "bg-red-soft text-red-deep" : "text-ink-soft hover:bg-black/[0.05] hover:text-ink",
          )}
        >
          <i.icon size={18} />
          <span className="flex-1">{i.label}</span>
          {"badge" in i && i.badge && newCount && newCount.count > 0 && (
            <span className="grid min-w-5 place-items-center rounded-full bg-red px-1.5 text-[0.7rem] font-bold leading-5 text-white">
              {newCount.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-bg-soft">
      <LiveLeadNotifier />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-black/[0.07] bg-white p-4 md:flex">
        <Link href="/admin" className="px-2 py-3">
          <Logo />
          <span className="ml-1 text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">admin</span>
        </Link>
        <div className="mt-4 flex-1 overflow-y-auto">{nav}</div>
        <div className="border-t border-black/[0.07] pt-3">
          <p className="truncate px-2 text-xs text-ink-mute">{me?.email}</p>
          <button onClick={onSignOut} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-black/[0.05]">
            <LogOut size={18} /> Deconectare
          </button>
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-black/[0.07] bg-white px-4 py-3 md:hidden">
        <Link href="/admin"><Logo /></Link>
        <button aria-label={open ? "Închide meniul" : "Deschide meniul"} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-black/[0.05]">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
      <div
        className={clsx(
          "fixed inset-x-0 top-[57px] z-30 border-b border-black/[0.07] bg-white p-3 shadow-lg transition-[opacity,transform,visibility] duration-200 md:hidden",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
        inert={!open}
      >
        {nav}
        <button onClick={onSignOut} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-black/[0.05]">
          <LogOut size={18} /> Deconectare
        </button>
      </div>

      <main className="px-4 py-6 md:ml-64 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
