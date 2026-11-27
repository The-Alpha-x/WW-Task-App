import {
  formatCompactDate,
  formatLocalDate,
  formatLongDate,
  formatTime,
  formatTimestamp,
  getRelativeDayLabel,
} from "@/lib/date-time";
import type { Memory, MemoryType } from "@/types/memory";

/**
 * Pure presentation helpers for memories (no React, no Firebase). Dates are
 * local `YYYY-MM-DD` strings handled via `@/lib/date-time` without UTC drift.
 */

export {
  formatLongDate as formatMemoryDate,
  formatCompactDate as formatMemoryDateShort,
  formatTime as formatMemoryTime,
  formatTimestamp as formatMemoryTimestamp,
  getRelativeDayLabel,
};

/** "Nov 2024" or "November 2024" — month-year heading for the timeline. */
export function formatMemoryMonthYear(date: string): string {
  return formatLocalDate(date, { month: "long", year: "numeric" });
}

/** "Sat, Nov 28 at 7:30 PM" or "Sat, Nov 28" if no time. */
export function formatMemoryWhen(memory: Pick<Memory, "date" | "time">): string {
  const datePart = formatCompactDate(memory.date);
  return memory.time ? `${datePart} at ${formatTime(memory.time)}` : datePart;
}

export function getMemoryTypeLabel(type: MemoryType): string {
  return type === "shared" ? "Shared" : "Personal";
}

/** Accessible one-liner for a card link. */
export function getMemoryAriaLabel(memory: Memory): string {
  return `${memory.title}, ${formatMemoryWhen(memory)}, ${getMemoryTypeLabel(memory.type).toLowerCase()}`;
}

/** Group memories by month-year key (YYYY-MM), preserving order (newest first). */
export function groupMemoriesByMonth(
  memories: readonly Memory[],
): Map<string, Memory[]> {
  const map = new Map<string, Memory[]>();
  for (const memory of memories) {
    const key = memory.date.slice(0, 7); // "YYYY-MM"
    const group = map.get(key);
    if (group) {
      group.push(memory);
    } else {
      map.set(key, [memory]);
    }
  }
  return map;
}
