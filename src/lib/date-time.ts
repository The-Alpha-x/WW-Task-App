/**
 * Shared local wall-clock date/time helpers (no React, no Firebase).
 * All `YYYY-MM-DD` / `HH:mm` values are handled in local time without UTC drift.
 */

export function getLocalDate(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalTime(value = new Date()): string {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Parses a `YYYY-MM-DD` string at local midnight, returning null for invalid calendar dates. */
export function parseLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

/** True for a real calendar date written as `YYYY-MM-DD` (rejects e.g. 2026-02-30). */
export function isValidDateString(value: string): boolean {
  return parseLocalDate(value) !== null;
}

/** True for a 24-hour `HH:mm` time (00:00 to 23:59). */
export function isValidTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Calendar-day arithmetic on `YYYY-MM-DD` strings, in local time. */
export function addDaysToDate(value: string, days: number): string {
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
  return getLocalDate(new Date(year, month - 1, day + days));
}

export function formatLocalDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = parseLocalDate(value);
  return date ? new Intl.DateTimeFormat("en", options).format(date) : value;
}

/** "Sat, Nov 28" */
export function formatCompactDate(value: string): string {
  return formatLocalDate(value, { weekday: "short", month: "short", day: "numeric" });
}

/** "28 November" */
export function formatShortDate(value: string): string {
  return formatLocalDate(value, { day: "numeric", month: "long" });
}

/** "Saturday, November 28, 2026" */
export function formatLongDate(value: string): string {
  return formatLocalDate(value, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** "7:30 PM" */
export function formatTime(value: string): string {
  if (!isValidTimeString(value)) return value;
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hours, minutes));
}

/** "Nov 26, 2026, 4:12 PM" for an ISO instant (audit timestamps), in local time. */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Whole calendar days from `now`'s day to `value`'s day (negative = past). */
export function getDaysFromToday(value: string, now = new Date()): number | null {
  const target = parseLocalDate(value);
  const today = parseLocalDate(getLocalDate(now));
  if (!target || !today) return null;
  // Both are local midnights; rounding absorbs the 23/25-hour DST days.
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** "Today", "Tomorrow", "In 5 days", "Yesterday", "3 days ago"; null when far away. */
export function getRelativeDayLabel(value: string, now = new Date()): string | null {
  const days = getDaysFromToday(value, now);
  if (days === null) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days <= 30) return `In ${days} days`;
  if (days < -1 && days >= -30) return `${-days} days ago`;
  return null;
}
