"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery } from "convex/react";
import { Bell, BellOff, Smartphone, Volume2 } from "lucide-react";
import { api } from "@convex/_generated/api";
import { Badge, Btn, Card, Field, Input, PageHeader, Skeleton } from "@/components/admin/ui";
import { errMsg, useToast } from "@/components/admin/toast";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const SOUND_KEY = "winex-admin-sound";

function urlB64ToUint8Array(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type NotifForm = { leadEmailTo: string; pushOnLead: boolean; pushOnSubscriber: boolean };

// Lettura sicura di API del browser (null su server / prima dell'idratazione).
const noopSubscribe = () => () => undefined;
function useBrowser<T>(read: () => T, server: T): T {
  return useSyncExternalStore(noopSubscribe, read, () => server);
}

export default function NotificationsPage() {
  const settings = useQuery(api.settings.getAdmin);
  if (!settings) return <Skeleton className="h-96" />;
  const n = (settings.notifications ?? {}) as Partial<NotifForm>;
  return <Content initial={{ leadEmailTo: n.leadEmailTo ?? "", pushOnLead: n.pushOnLead ?? true, pushOnSubscriber: n.pushOnSubscriber ?? false }} />;
}

function Content({ initial }: { initial: NotifForm }) {
  const toast = useToast();
  const mine = useQuery(api.push.mine);
  const saveNotif = useMutation(api.settings.saveNotifications);
  const saveSub = useMutation(api.push.saveSubscription);
  const removeSub = useMutation(api.push.removeSubscription);

  const supported = useBrowser<boolean | null>(() => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window, null);
  const initialPerm = useBrowser<NotificationPermission | "unsupported">(() => ("Notification" in window ? Notification.permission : "unsupported"), "default");
  const initialSound = useBrowser(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      return true;
    }
  }, true);
  const [permOverride, setPerm] = useState<NotificationPermission | null>(null);
  const perm = permOverride ?? initialPerm;
  const [thisEndpoint, setThisEndpoint] = useState<string | null>(null);
  const [soundOverride, setSound] = useState<boolean | null>(null);
  const sound = soundOverride ?? initialSound;
  const [form, setForm] = useState<NotifForm>(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.getRegistration("/admin").then((r) => r?.pushManager.getSubscription()).then((s) => setThisEndpoint(s?.endpoint ?? null)).catch(() => undefined);
  }, [supported]);

  async function enable() {
    if (!VAPID) return toast("Cheile VAPID nu sunt configurate (vezi README).", "error");
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/admin" });
      await navigator.serviceWorker.ready;
      const p = await Notification.requestPermission();
      setPerm(p);
      if (p !== "granted") return toast("Permisiunea pentru notificări a fost refuzată.", "error");
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID) }));
      const j = sub.toJSON();
      await saveSub({ endpoint: sub.endpoint, p256dh: j.keys!.p256dh!, auth: j.keys!.auth!, userAgent: navigator.userAgent.slice(0, 200) });
      setThisEndpoint(sub.endpoint);
      toast("Notificări push activate pe acest dispozitiv");
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/admin");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removeSub({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setThisEndpoint(null);
      toast("Notificări push dezactivate pe acest dispozitiv");
    } finally {
      setBusy(false);
    }
  }

  const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;

  return (
    <>
      <PageHeader title="Notificări" subtitle="Cum ești anunțat instantaneu când primești un mesaj sau un abonat nou." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Notificări push pe acest dispozitiv" action={thisEndpoint ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}>
          {supported === null ? (
            <Skeleton className="h-20" />
          ) : !supported ? (
            <p className="text-sm text-ink-soft">
              Acest browser nu suportă notificări push.{isIOS && " Pe iPhone: deschide pagina în Safari, apasă „Partajare” → „Adaugă pe ecranul principal”, apoi deschide aplicația instalată."}
            </p>
          ) : (
            <>
              {isIOS && !standalone && (
                <p className="mb-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
                  <Smartphone size={14} className="mr-1.5 inline" />Pe iPhone, notificările funcționează doar după ce adaugi site-ul pe ecranul principal (Partajare → Adaugă pe ecranul principal) și îl deschizi de acolo.
                </p>
              )}
              <p className="text-sm text-ink-soft">Primești o notificare chiar și cu panoul închis. Notificarea nu conține conținutul mesajului, doar numele expeditorului.</p>
              {!VAPID && <p className="mt-3 rounded-xl bg-red-soft px-3.5 py-2.5 text-sm text-red-deep">Lipsește NEXT_PUBLIC_VAPID_PUBLIC_KEY (vezi README, secțiunea Admin).</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {thisEndpoint ? (
                  <>
                    <Btn disabled={busy} onClick={() => void disable()}><BellOff size={16} /> Dezactivează</Btn>
                    <Btn disabled={busy} onClick={() => fetch("/api/admin/test-push", { method: "POST" }).then((r) => toast(r.ok ? "Notificare de test trimisă" : "Nu am putut trimite testul", r.ok ? "info" : "error"))}>Trimite test</Btn>
                  </>
                ) : (
                  <Btn variant="primary" disabled={busy || !VAPID} onClick={() => void enable()}><Bell size={16} /> Activează notificările</Btn>
                )}
              </div>
              {perm === "denied" && <p className="mt-3 text-xs text-red-deep">Notificările sunt blocate în setările browserului pentru acest site.</p>}
              {mine && mine.length > 0 && <p className="mt-4 text-xs text-ink-mute">Dispozitive înregistrate pentru contul tău: {mine.length}</p>}
            </>
          )}
        </Card>

        <Card title="Alerte cât timp panoul e deschis">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold"><Volume2 size={16} /> Sunet la mesaj nou</p>
              <p className="text-xs text-ink-mute">Plus notificare în colțul ecranului și numărul în titlul filei. Browserul poate cere un click pe pagină înainte de a reda sunetul.</p>
            </div>
            <input type="checkbox" checked={sound} aria-label="Sunet la mesaj nou" className="h-5 w-5 accent-[var(--red)]" onChange={(e) => { setSound(e.target.checked); try { localStorage.setItem(SOUND_KEY, e.target.checked ? "on" : "off"); } catch {} }} />
          </div>
        </Card>

        <Card title="Alerte prin e-mail și push (server)" className="lg:col-span-2">
          {
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveNotif({ value: form }).then(() => toast("Setări salvate")).catch((err) => toast(errMsg(err), "error"));
              }}
            >
              <Field label="Trimite e-mail instant la" hint="Lasă gol pentru adresa implicită din configurarea serverului (CONTACT_TO_EMAIL).">
                <Input type="email" value={form.leadEmailTo} onChange={(e) => setForm({ ...form, leadEmailTo: e.target.value })} placeholder="mesaje@winex.ro" />
              </Field>
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.pushOnLead} onChange={(e) => setForm({ ...form, pushOnLead: e.target.checked })} className="h-4 w-4 accent-[var(--red)]" /> Notificare push la fiecare mesaj nou</label>
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.pushOnSubscriber} onChange={(e) => setForm({ ...form, pushOnSubscriber: e.target.checked })} className="h-4 w-4 accent-[var(--red)]" /> Notificare push la fiecare abonat nou confermat</label>
              <Btn variant="primary" type="submit">Salvează</Btn>
            </form>
          }
        </Card>
      </div>
    </>
  );
}
