import { addDaysToDate, getLocalDate, isValidTimeString } from "@/lib/date-time";
import type { Event } from "@/types/event";

export interface CalendarDay {
  /** Local `YYYY-MM-DD`. */
  date: string;
  /** Short weekday name, e.g. "Mon". */
  weekdayShort: string;
  /** Day of month (1..31). */
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

export interface WeekSlice {
  /** Monday `YYYY-MM-DD` of this week. */
  weekStart: string;
  /** Sunday `YYYY-MM-DD` of this week. */
  weekEnd: string;
  /** Month label for this week (from the first in-month/Thursday day, e.g. "Nov 2026"). */
  monthLabel: string;
  days: CalendarDay[];
}

export interface MonthCalendarGrid {
  /** e.g. "Nov 2026". */
  monthLabel: string;
  /** First day of the month, `YYYY-MM-DD`. */
  monthStart: string;
  /** Last day of the month, `YYYY-MM-DD`. */
  monthEnd: string;
  /** Number of blank cells before day 1 (Monday = 0 .. Sunday = 6). */
  leadingEmptyCount: number;
  days: CalendarDay[];
}

const WEEKDAY_SHORT = new Intl.DateTimeFormat("en", { weekday: "short" });
const MONTH_YEAR_SHORT = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

function getMondayOfDate(dateStr: string): string {
  const [year = 0, month = 1, day = 1] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const mondayOffset = -((d.getDay() + 6) % 7);
  return addDaysToDate(dateStr, mondayOffset);
}

/**
 * Generates a contiguous sequence of Monday-first weeks starting from the week
 * containing the 1st of `now`'s month through `futureWeeks` weeks after
 * `now`'s current week. Also returns `currentWeekIndex` so the UI can land
 * on this week immediately.
 */
export function getScrollableWeeks(
  now = new Date(),
  futureWeeks = 12,
): { weeks: WeekSlice[]; currentWeekIndex: number } {
  const todayStr = getLocalDate(now);
  const currentMonth = now.getMonth();

  const monthFirstStr = getLocalDate(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const firstMonday = getMondayOfDate(monthFirstStr);
  const currentMonday = getMondayOfDate(todayStr);

  const [fmY = 0, fmM = 1, fmD = 1] = firstMonday.split("-").map(Number);
  const [cmY = 0, cmM = 1, cmD = 1] = currentMonday.split("-").map(Number);
  const diffDays = Math.round(
    (new Date(cmY, cmM - 1, cmD).getTime() -
      new Date(fmY, fmM - 1, fmD).getTime()) /
      86_400_000,
  );
  const currentWeekIndex = Math.max(0, Math.round(diffDays / 7));
  const totalWeeks = currentWeekIndex + 1 + futureWeeks;

  const weeks: WeekSlice[] = Array.from({ length: totalWeeks }, (_, w) => {
    const weekStart = addDaysToDate(firstMonday, w * 7);
    const weekEnd = addDaysToDate(weekStart, 6);
    const days: CalendarDay[] = Array.from({ length: 7 }, (_, dIndex) => {
      const dateStr = addDaysToDate(weekStart, dIndex);
      const [year = 0, month = 1, day = 1] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return {
        date: dateStr,
        weekdayShort: WEEKDAY_SHORT.format(d),
        dayNumber: day,
        isToday: dateStr === todayStr,
        isCurrentMonth: d.getMonth() === currentMonth,
      };
    });

    // Use Thursday (index 3) to represent the week's primary month label.
    const repStr = days[3]?.date ?? weekStart;
    const [rY = 0, rM = 1, rD = 1] = repStr.split("-").map(Number);
    const monthLabel = MONTH_YEAR_SHORT.format(new Date(rY, rM - 1, rD));

    return { weekStart, weekEnd, monthLabel, days };
  });

  return { weeks, currentWeekIndex };
}

/**
 * Full Monday-first calendar grid for `now`'s month + `monthOffset`
 * (`0` = this month, `1` = next month, etc.).
 */
export function getMonthCalendarGrid(
  now = new Date(),
  monthOffset = 0,
): MonthCalendarGrid {
  const todayStr = getLocalDate(now);
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = target.getFullYear();
  const month = target.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthStart = getLocalDate(target);
  const monthEnd = getLocalDate(new Date(year, month, daysInMonth));
  const leadingEmptyCount = (target.getDay() + 6) % 7;

  const days: CalendarDay[] = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNumber = i + 1;
    const d = new Date(year, month, dayNumber);
    const date = getLocalDate(d);
    return {
      date,
      weekdayShort: WEEKDAY_SHORT.format(d),
      dayNumber,
      isToday: date === todayStr,
      isCurrentMonth: true,
    };
  });

  return {
    monthLabel: MONTH_YEAR_SHORT.format(target),
    monthStart,
    monthEnd,
    leadingEmptyCount,
    days,
  };
}

/** Drops any events before the first day of `now`'s month. */
export function filterEventsFromCurrentMonth(
  events: readonly Event[],
  now = new Date(),
): Event[] {
  const monthStart = getLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
  return events.filter((event) => event.date >= monthStart);
}

/** Groups already-sorted events by `YYYY-MM-DD`. */
export function groupEventsByDate(events: readonly Event[]): Map<string, Event[]> {
  const map = new Map<string, Event[]>();
  for (const event of events) {
    const list = map.get(event.date);
    if (list) {
      list.push(event);
    } else {
      map.set(event.date, [event]);
    }
  }
  return map;
}

/** Splits `HH:mm` into `{ main: "9:00", period: "AM" }` for the timeline column. */
export function formatTimeParts(value: string): { main: string; period: string } {
  if (!isValidTimeString(value)) return { main: value, period: "" };
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  const formatted = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hours, minutes));
  const parts = formatted.split(/\s+/);
  return {
    main: parts[0] ?? formatted,
    period: parts[1] ?? "",
  };
}
