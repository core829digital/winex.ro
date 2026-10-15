import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal className={clsx("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-[clamp(2rem,4.4vw,3.4rem)] font-extrabold">{title}</h2>
      {lead && <p className="mt-5 text-lg text-ink-soft">{lead}</p>}
    </Reveal>
  );
}
