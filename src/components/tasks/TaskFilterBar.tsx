import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { TaskFilter, TaskFilterOption } from "@/lib/tasks/filters";

export interface TaskFilterBarProps {
  filters: readonly TaskFilterOption[];
  value: TaskFilter;
  onChange: (filter: TaskFilter) => void;
  /** Optional task count shown beside each label. */
  counts?: Partial<Record<TaskFilter, number>>;
  className?: string;
}

/**
 * Row of filter buttons. The selected one is the lime primary button, the
 * others are ghost buttons, so no new styling is introduced. Each is a
 * toggle (`aria-pressed`); the row wraps instead of scrolling sideways.
 */
export function TaskFilterBar({
  filters,
  value,
  onChange,
  counts,
  className,
}: TaskFilterBarProps) {
  return (
    <div
      role="group"
      aria-label="Filter tasks"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {filters.map((filter) => {
        const selected = filter.value === value;
        const count = counts?.[filter.value];
        return (
          <Button
            key={filter.value}
            size="sm"
            variant={selected ? "primary" : "ghost"}
            aria-pressed={selected}
            className={cn(!selected && "ring-1 ring-glass-border/10")}
            onClick={() => onChange(filter.value)}
          >
            {filter.label}
            {count !== undefined && (
              <span className="font-medium">{count}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
