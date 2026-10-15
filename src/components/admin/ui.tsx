"use client";

import { clsx } from "clsx";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={clsx("rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_1px_2px_rgba(37,40,45,0.04)]", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-base font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_1px_2px_rgba(37,40,45,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-mute">{label}</p>
      <p className={clsx("mt-2 font-display text-3xl font-extrabold tabular-nums", accent && "text-red")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

const tones = {
  gray: "bg-black/[0.06] text-ink-soft",
  red: "bg-red-soft text-red-deep",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-sky-50 text-sky-700",
} as const;

export function Badge({ tone = "gray", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}

type BtnProps = ComponentProps<"button"> & { variant?: "primary" | "ghost" | "danger" | "soft"; size?: "sm" | "md" };
export function Btn({ variant = "soft", size = "md", className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm",
        variant === "primary" && "bg-red text-white hover:bg-red-deep",
        variant === "soft" && "bg-black/[0.05] text-ink hover:bg-black/[0.09]",
        variant === "ghost" && "text-ink-soft hover:bg-black/[0.05]",
        variant === "danger" && "bg-red-soft text-red-deep hover:bg-red/20",
        className,
      )}
    />
  );
}

/** Conferma a due passaggi (evita eliminazioni accidentali, senza dialog bloccanti). */
export function ConfirmBtn({ label, confirmLabel = "Sigur?", onConfirm, size = "sm" }: { label: ReactNode; confirmLabel?: string; onConfirm: () => void; size?: "sm" | "md" }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Btn
      variant="danger"
      size={size}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : label}
    </Btn>
  );
}

export const inputCls =
  "w-full rounded-xl border border-black/[0.1] bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-mute focus:border-red focus:ring-4 focus:ring-red/10";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-mute">{hint}</span>}
    </label>
  );
}

export function Input(p: ComponentProps<"input">) {
  return <input {...p} className={clsx(inputCls, p.className)} />;
}
export function Textarea(p: ComponentProps<"textarea">) {
  return <textarea {...p} className={clsx(inputCls, "resize-y", p.className)} />;
}

export function Empty({ title, text, icon }: { title: string; text?: string; icon?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-black/[0.12] px-6 py-14 text-center">
      {icon && <div className="mb-3 text-ink-mute">{icon}</div>}
      <p className="font-display font-bold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-soft">{text}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-xl bg-black/[0.06]", className)} />;
}

export function fmtDate(t: number) {
  return new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(t);
}

export function timeAgo(t: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 10) return "acum";
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.round(h / 24)} z`;
}
