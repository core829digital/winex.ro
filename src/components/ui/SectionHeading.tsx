import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function SectionHeading({
  index,
  eyebrow,
  title,
  lead,
  className,
  inverse,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
  inverse?: boolean;
}) {
  return (
    <Reveal className={clsx("max-w-3xl", className)}>
      <div className="flex items-center gap-4">
        {index && <span className={clsx("section-index", inverse && "!text-ink-inv-soft")}>{index}</span>}
        <p className="eyebrow">{eyebrow}</p>
      </div>
      <h2 className="h-section mt-5">{title}</h2>
      {lead && <p className="lead mt-5 max-w-2xl">{lead}</p>}
    </Reveal>
  );
}
