import type { ReactNode } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

export interface TaskSectionProps {
  title: string;
  count: number;
  /** Shown instead of `children` when `count` is 0. */
  emptyMessage: string;
  children?: ReactNode;
  className?: string;
}

/** One titled group of tasks: heading, then the list or an empty message. */
export function TaskSection({
  title,
  count,
  emptyMessage,
  children,
  className,
}: TaskSectionProps) {
  return (
    <section
      aria-label={title}
      data-slot={`task-section-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn("flex flex-col gap-4", className)}
    >
      <SectionHeading title={title} />
      {count === 0 ? (
        <p className="text-sm font-medium text-on-dark-muted">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  );
}
