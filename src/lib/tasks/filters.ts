import { addDaysToDate, getLocalDate, parseLocalDate } from "@/lib/date-time";
import type { Task } from "@/types/task";

export type TaskFilter = "today" | "week" | "month";

export interface TaskFilterOption {
  value: TaskFilter;
  label: string;
}

/** Tab order as shown on the Tasks page. */
export const TASK_FILTERS: readonly TaskFilterOption[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

export interface TimeframeTasks {
  pending: Task[];
  completed: Task[];
}

export interface WeekDayOption {
  date: string;
  shortLabel: string;
  dayNumber: string;
  fullLabel: string;
  isToday: boolean;
}

function getWeekRange(now = new Date()): { start: string; end: string } {
  const today = getLocalDate(now);
  // Monday = 0 ... Sunday = 6
  const mondayOffset = (now.getDay() + 6) % 7;
  const start = addDaysToDate(today, -mondayOffset);
  const end = addDaysToDate(start, 6);
  return { start, end };
}

/** Returns the 7 calendar days of the current week, Monday through Sunday. */
export function getWeekDays(now = new Date()): WeekDayOption[] {
  const today = getLocalDate(now);
  const { start } = getWeekRange(now);
  const shortDayFmt = new Intl.DateTimeFormat("en", { weekday: "short" });
  const fullDayFmt = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDaysToDate(start, index);
    const parsed = parseLocalDate(date) ?? now;
    return {
      date,
      shortLabel: shortDayFmt.format(parsed),
      dayNumber: String(parsed.getDate()),
      fullLabel: fullDayFmt.format(parsed),
      isToday: date === today,
    };
  });
}

function getMonthRange(now = new Date()): { start: string; end: string } {
  const year = now.getFullYear();
  const month = now.getMonth();
  return {
    start: getLocalDate(new Date(year, month, 1)),
    end: getLocalDate(new Date(year, month + 1, 0)),
  };
}

/** Returns `YYYY-MM-01` shifted by `deltaMonths` from the given `YYYY-MM-DD` date. */
export function shiftMonthDate(date: string, deltaMonths: number): string {
  const parsed = parseLocalDate(date) ?? new Date();
  const target = new Date(parsed.getFullYear(), parsed.getMonth() + deltaMonths, 1);
  return getLocalDate(target);
}

/** Formats a `YYYY-MM-DD` date as `"November 2026"`. */
export function formatMonthYear(date: string): string {
  const parsed = parseLocalDate(date) ?? new Date();
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export interface MonthCalendarDay {
  date: string;
  dayNumber: string;
  inCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Returns the 6x7 (or 5x7) Monday-first calendar grid cells covering the
 * month of `anchorDate` (`YYYY-MM-DD`).
 */
export function getMonthCalendarDays(
  anchorDate: string,
  now = new Date(),
): MonthCalendarDay[] {
  const today = getLocalDate(now);
  const parsed = parseLocalDate(anchorDate) ?? now;
  const year = parsed.getFullYear();
  const month = parsed.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Monday = 0 ... Sunday = 6
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const endOffset = 6 - ((lastOfMonth.getDay() + 6) % 7);
  const totalDays = startOffset + lastOfMonth.getDate() + endOffset;
  const gridStart = addDaysToDate(getLocalDate(firstOfMonth), -startOffset);

  return Array.from({ length: totalDays }, (_, index) => {
    const date = addDaysToDate(gridStart, index);
    const cellDate = parseLocalDate(date) ?? now;
    return {
      date,
      dayNumber: String(cellDate.getDate()),
      inCurrentMonth: cellDate.getMonth() === month && cellDate.getFullYear() === year,
      isToday: date === today,
    };
  });
}

function comparePendingTasks(a: Task, b: Task): number {
  if (a.date && b.date) {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
  } else if (a.date) {
    return -1;
  } else if (b.date) {
    return 1;
  }
  return a.createdAt.localeCompare(b.createdAt);
}

function compareCompletedTasks(a: Task, b: Task): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

/**
 * Partitions tasks into upcoming pending tasks and completed tasks for a
 * specific `YYYY-MM-DD` date (used by the Monday–Sunday selector in This Week).
 */
export function selectTasksForDate(
  tasks: readonly Task[],
  date: string,
  now = new Date(),
): TimeframeTasks {
  const today = getLocalDate(now);
  const pending: Task[] = [];
  const completed: Task[] = [];

  for (const task of tasks) {
    if (task.completed) {
      const matchesDate = task.date ? task.date === date : task.updatedDate === date;
      if (matchesDate) completed.push(task);
    } else {
      const matchesDate =
        task.date === date ||
        (date === today && task.date === null && Boolean(task.time));
      if (matchesDate) pending.push(task);
    }
  }

  pending.sort(comparePendingTasks);
  completed.sort(compareCompletedTasks);

  return { pending, completed };
}

/**
 * Partitions tasks into upcoming pending tasks and completed tasks for the
 * selected timeframe (`today`, `week`, or `month`).
 */
export function selectTasksForTimeframe(
  tasks: readonly Task[],
  timeframe: TaskFilter,
  now = new Date(),
): TimeframeTasks {
  const today = getLocalDate(now);
  const week = getWeekRange(now);
  const month = getMonthRange(now);

  const pending: Task[] = [];
  const completed: Task[] = [];

  for (const task of tasks) {
    if (timeframe === "today") {
      if (task.completed) {
        if (task.updatedDate === today || task.date === today) {
          completed.push(task);
        }
      } else if (task.date !== null ? task.date <= today : Boolean(task.time)) {
        pending.push(task);
      }
      continue;
    }

    const range = timeframe === "week" ? week : month;
    if (task.completed) {
      const inRangeByDueDate =
        task.date !== null && task.date >= range.start && task.date <= range.end;
      const inRangeByUpdateDate =
        task.updatedDate >= range.start && task.updatedDate <= range.end;
      if (inRangeByDueDate || inRangeByUpdateDate) {
        completed.push(task);
      }
    } else if (
      task.date !== null
        ? task.date <= range.end
        : timeframe === "month" || Boolean(task.time)
    ) {
      pending.push(task);
    }
  }

  pending.sort(comparePendingTasks);
  completed.sort(compareCompletedTasks);

  return { pending, completed };
}

/** Number of tasks visible in each timeframe tab. */
export function countTasksByFilter(
  tasks: readonly Task[],
  now = new Date(),
): Record<TaskFilter, number> {
  const today = selectTasksForTimeframe(tasks, "today", now);
  const week = selectTasksForTimeframe(tasks, "week", now);
  const month = selectTasksForTimeframe(tasks, "month", now);

  return {
    today: today.pending.length + today.completed.length,
    week: week.pending.length + week.completed.length,
    month: month.pending.length + month.completed.length,
  };
}

/** Daily progress counts consistent with the Today tab. */
export function getDailyProgressCounts(
  tasks: readonly Task[],
  now = new Date(),
): { completedToday: number; totalToday: number } {
  const { pending, completed } = selectTasksForTimeframe(tasks, "today", now);
  return {
    completedToday: completed.length,
    totalToday: pending.length + completed.length,
  };
}

export interface MonthTaskBuckets {
  upcoming: Task[];
  previous: Task[];
  completed: Task[];
}

/**
 * Partitions tasks belonging to the month of `anchorDate` (`YYYY-MM-DD`) into:
 * - `upcoming`: pending tasks in that month due today or in the future
 * - `previous`: pending tasks in that month due before today
 * - `completed`: completed tasks whose due date (or updatedDate) falls in that month
 */
export function selectTasksForSpecificMonth(
  tasks: readonly Task[],
  anchorDate: string,
  now = new Date(),
): MonthTaskBuckets {
  const today = getLocalDate(now);
  const parsed = parseLocalDate(anchorDate) ?? now;
  const { start, end } = getMonthRange(parsed);

  const upcoming: Task[] = [];
  const previous: Task[] = [];
  const completed: Task[] = [];

  for (const task of tasks) {
    if (task.completed) {
      const refDate = task.date ?? task.updatedDate;
      if (refDate >= start && refDate <= end) {
        completed.push(task);
      }
      continue;
    }

    if (task.date !== null && task.date >= start && task.date <= end) {
      if (task.date < today) {
        previous.push(task);
      } else {
        upcoming.push(task);
      }
    }
  }

  upcoming.sort(comparePendingTasks);
  previous.sort(comparePendingTasks);
  completed.sort(compareCompletedTasks);

  return { upcoming, previous, completed };
}

/**
 * Partitions all tasks across every month into:
 * - `upcoming`: pending tasks due today or in the future, plus undated pending tasks
 * - `previous`: pending tasks with a due date before today
 * - `completed`: all completed tasks, most recently updated first
 */
export function selectAllTaskBuckets(
  tasks: readonly Task[],
  now = new Date(),
): MonthTaskBuckets {
  const today = getLocalDate(now);
  const upcoming: Task[] = [];
  const previous: Task[] = [];
  const completed: Task[] = [];

  for (const task of tasks) {
    if (task.completed) {
      completed.push(task);
    } else if (task.date !== null && task.date < today) {
      previous.push(task);
    } else {
      upcoming.push(task);
    }
  }

  upcoming.sort(comparePendingTasks);
  previous.sort(comparePendingTasks);
  completed.sort(compareCompletedTasks);

  return { upcoming, previous, completed };
}
