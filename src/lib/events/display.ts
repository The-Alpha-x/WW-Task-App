import type { BadgeVariant } from "@/components/ui/Badge";
import {
  formatCompactDate,
  formatLocalDate,
  formatLongDate,
  formatTime,
  formatTimestamp,
  getRelativeDayLabel,
} from "@/lib/date-time";
import type { Event, EventType } from "@/types/event";

/**
 * Pure presentation helpers for events (no React, no Firebase). Dates are
 * local `YYYY-MM-DD` strings handled via `@/lib/date-time` without UTC drift.
 */

export {
  formatLongDate as formatEventDate,
  formatCompactDate as formatEventDateShort,
  formatTime as formatEventTime,
  formatTimestamp as formatEventTimestamp,
  getRelativeDayLabel,
};

/** The three parts of the date tile on a card: "Sat", "28", "Nov". */
export function getEventDateParts(value: string): {
  weekday: string;
  day: string;
  month: string;
} {
  return {
    weekday: formatLocalDate(value, { weekday: "short" }),
    day: formatLocalDate(value, { day: "numeric" }),
    month: formatLocalDate(value, { month: "short" }),
  };
}

/** "Sat, Nov 28 at 7:30 PM", for one-line summaries. */
export function formatEventWhen(event: Pick<Event, "date" | "time">): string {
  return `${formatCompactDate(event.date)} at ${formatTime(event.time)}`;
}

export function getEventTypeLabel(type: EventType): string {
  return type === "shared" ? "Shared" : "Individual";
}

/** Shared is the purple pill, individual the outlined one (light surfaces). */
export function getEventTypeBadgeVariant(type: EventType): BadgeVariant {
  return type === "shared" ? "purple" : "outline";
}

/** Accessible one-liner for a card link, e.g. "Dinner, Sat, Nov 28 at 7:30 PM, shared". */
export function getEventAriaLabel(event: Event): string {
  return `${event.title}, ${formatEventWhen(event)}, ${getEventTypeLabel(event.type).toLowerCase()}`;
}
