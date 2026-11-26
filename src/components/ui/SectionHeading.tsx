import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SectionHeadingProps {
  title: string;
  /** Heading level element to render. Defaults to h2. */
  as?: "h1" | "h2" | "h3" | "h4";
  /** Optional leading icon (decorative). */
  icon?: ReactNode;
  /** Optional count shown in a lime-outlined circle. */
  count?: number;
  /** Optional trailing control, e.g. an IconButton. */
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  as: Heading = "h2",
  icon,
  count,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span aria-hidden="true" className="inline-flex shrink-0 text-lime">
            {icon}
          </span>
        )}
        {count !== undefined && (
          <span
            className="inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border-2 border-lime px-3 text-sm font-bold text-lime"
          >
            {count}
          </span>
        )}
        <Heading className="truncate text-xl font-bold tracking-tight text-on-dark sm:text-2xl">
          {title}
        </Heading>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
