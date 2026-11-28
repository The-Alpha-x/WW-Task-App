"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SubtaskRowProps {
  title: string;
  /** Controlled state. Pair with `onCheckedChange` to make the row toggle. */
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Form field name, if the row is used inside a form. */
  name?: string;
  className?: string;
}

/**
 * Subtask row with a circular checkbox. A real `<input type="checkbox">`
 * (visually hidden, but covering the circle) provides keyboard, screen
 * reader and form behaviour; the whole row is its label, so the entire row
 * is clickable. Designed for light surfaces (the Sub Tasks sheet).
 */
export function SubtaskRow({
  title,
  checked,
  onCheckedChange,
  disabled = false,
  name,
  className,
}: SubtaskRowProps) {
  return (
    <label
      className={cn(
        "flex min-h-16 items-center gap-4 rounded-lg border border-border px-4 py-3 text-ink transition-colors duration-base ease-standard",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-card-muted",
        className,
      )}
    >
      <span className="relative inline-flex h-8 w-8 shrink-0">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange?.(event.target.checked)}
          className="peer absolute inset-0 m-0 h-full w-full cursor-[inherit] appearance-none rounded-full opacity-0"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-ink transition-colors duration-base ease-standard peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
        />
        <Check
          aria-hidden="true"
          size={16}
          strokeWidth={3}
          className="pointer-events-none absolute left-2 top-2 text-[rgb(var(--color-lime))] opacity-0 transition-opacity duration-fast ease-standard peer-checked:opacity-100"
        />
      </span>
      <span
        className={cn(
          "min-w-0 text-base font-semibold",
          checked && "text-ink-muted line-through",
        )}
      >
        {title}
      </span>
    </label>
  );
}
