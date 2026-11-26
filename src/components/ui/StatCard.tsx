"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

export type StatCardVariant = "completed" | "planned";

export interface StatCardProps {
  /** `completed` is the purple tile, `planned` the lime tile. */
  variant: StatCardVariant;
  /** The large number. Designed for 1 to 3 digits. */
  value: number;
  /** Descriptive label under the number, e.g. "Tasks Completed". */
  label: string;
  /**
   * Date pill shown at the bottom of the `planned` tile, e.g. "TUE.13.JAN".
   * Ignored by the `completed` tile, which shows a check badge instead.
   */
  date?: string;
  /** Called when the circular arrow is pressed. Without it the arrow is shown but inactive. */
  onAction?: () => void;
  /** Accessible name for the arrow. Defaults to "View <label>". */
  actionLabel?: string;
  /** Called when the date pill is pressed. Without it the pill is display-only. */
  onDateClick?: () => void;
  className?: string;
}

/**
 * Notched statistics tile from the reference. The silhouette is pure CSS
 * (`.stat-card` in globals.css); the arrow is the shared IconButton and the
 * date pill is the shared dark Button.
 */
export function StatCard({
  variant,
  value,
  label,
  date,
  onAction,
  actionLabel,
  onDateClick,
  className,
}: StatCardProps) {
  const isCompleted = variant === "completed";

  return (
    <div
      role="group"
      aria-label={`${value} ${label}`}
      className={cn(
        "stat-card",
        isCompleted ? "stat-card--completed" : "stat-card--planned",
        className,
      )}
    >
      <span aria-hidden="true" className="stat-card__sizer" />
      <span aria-hidden="true" className="stat-card__fillet" />
      {isCompleted && <span aria-hidden="true" className="stat-card__trail" />}

      <div className="stat-card__action">
        <IconButton
          icon={ArrowUpRight}
          label={actionLabel ?? `View ${label}`}
          size="md"
          disabled={!onAction}
          onClick={onAction}
          className="disabled:cursor-default disabled:opacity-100"
        />
      </div>

      <div className="stat-card__body">
        <p
          className={cn(
            "stat-card__value font-semibold tabular-nums",
            isCompleted ? "text-on-dark" : "text-ink",
          )}
        >
          {value}
        </p>

        {isCompleted ? (
          /* Reference: the label sits bottom-left, level with the check badge. */
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{label}</p>
            <span
              aria-hidden="true"
              className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-on-dark"
            >
              <Check size={20} strokeWidth={3} />
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-ink">{label}</p>
            {date && (
              <Button
                variant="dark"
                size="sm"
                disabled={!onDateClick}
                onClick={onDateClick}
                className="w-full max-sm:px-2 disabled:cursor-default disabled:opacity-100"
              >
                {date}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
