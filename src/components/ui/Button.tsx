import Link from "next/link";
import { clsx } from "clsx";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "glass" | "ghost";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[0.95rem] font-semibold tracking-tight transition-[transform,background-color,box-shadow] duration-200 ease-[var(--ease-out)] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-red text-white shadow-[0_10px_30px_-10px_rgba(220,36,48,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-red-deep hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_rgba(179,19,30,0.7),inset_0_1px_0_rgba(255,255,255,0.35)]",
  glass: "glass text-ink hover:-translate-y-0.5 hover:bg-white/80",
  ghost: "text-ink hover:text-red-deep",
};

type Common = { variant?: Variant; children: ReactNode; className?: string };

export function ButtonLink({
  variant = "primary",
  className,
  children,
  ...props
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: Common & ComponentProps<"button">) {
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
