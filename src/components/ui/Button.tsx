import { clsx } from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Variant = "primary" | "outline" | "light" | "ghost";

const base =
  "group relative inline-flex items-center justify-center gap-2.5 rounded-[var(--r-btn)] px-6 py-3.5 text-[0.9375rem] font-semibold tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out)] active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-red text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_1px_2px_rgba(16,24,40,0.12)] hover:bg-red-deep",
  outline: "border border-[var(--line-strong)] bg-white text-ink hover:border-ink hover:bg-ink hover:text-white",
  light: "bg-white text-ink hover:bg-[#f0f1f3]",
  ghost: "text-ink hover:text-red-deep",
};

type Common = { variant?: Variant; children: ReactNode; className?: string; arrow?: boolean };

export function ButtonLink({
  variant = "primary",
  className,
  children,
  arrow,
  ...props
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={clsx(base, variants[variant], className)} {...props}>
      {children}
      {arrow && <ArrowRight size={17} className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1" aria-hidden />}
    </Link>
  );
}

export function Button({ variant = "primary", className, children, ...props }: Omit<Common, "arrow"> & ComponentProps<"button">) {
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
