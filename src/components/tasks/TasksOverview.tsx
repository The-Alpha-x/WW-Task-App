"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAction } from "@/hooks/useAction";
import { useNow } from "@/hooks/useNow";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toaster";
import {
  buildEditedTask,
  deleteTask,
  saveTask,
  updateSubtaskCompletion,
  updateTaskCompletion,
} from "@/services/tasks";
import type { TaskFormSubmission } from "@/lib/tasks/form";
import { formatCompactDate, getLocalDate } from "@/lib/date-time";
import { getMonthCalendarGrid, getScrollableWeeks } from "@/lib/events/calendar";
import {
  selectAllTaskBuckets,
  selectTasksForDate,
  selectTasksForRange,
  selectTasksForSpecificMonth,
  selectTasksForTimeframe,
} from "@/lib/tasks/filters";
import { ADD_TASK_HREF } from "@/lib/navigation";
import { cn } from "@/lib/cn";
import type { Task } from "@/types/task";
import { ActiveTaskCard } from "./ActiveTaskCard";
import { TaskEditForm } from "./TaskEditForm";

export interface TasksOverviewProps {
  tasks: readonly Task[];
  userId: string;
  userName: string;
  avatarSrc?: string | null;
}

type TasksView = "week" | "month" | "all";

const VIEW_TABS: readonly { value: TasksView; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

const WEEKDAY_HEADERS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

/** Weeks the horizontal week scroller reaches back / forward from this week. */
const PAST_WEEKS = 26;
const FUTURE_WEEKS = 26;

interface BucketSection {
  title: string;
  tasks: readonly Task[];
  emptyMessage: string;
  /** Lime count pill for the actionable bucket (pending / upcoming). */
  emphasize?: boolean;
}

interface DayTaskInfo {
  total: number;
  pending: number;
}

function pluralTasks(count: number): string {
  return `${count} ${count === 1 ? "task" : "tasks"}`;
}

/**
 * Tasks overview, laid out like the Events overview: Week / Month tabs (plus
 * All), an "All this week / month" toggle, horizontally scrollable weeks in
 * Week view, a month grid with month navigation, and the tasks for the chosen
 * day or period underneath.
 */
export function TasksOverview({ tasks, userId }: TasksOverviewProps) {
  const reduce = useReducedMotion();
  const now = useNow();
  const today = getLocalDate(now);

  const [view, setView] = useState<TasksView>("week");
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [monthOffset, setMonthOffset] = useState(0);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const {
    run,
    pending: savingEdit,
    error: saveError,
  } = useAction("Could not update this task.");

  const { weeks, currentWeekIndex } = useMemo(
    () => getScrollableWeeks(now, FUTURE_WEEKS, PAST_WEEKS),
    [now],
  );
  const [activeWeekIndex, setActiveWeekIndex] = useState(currentWeekIndex);
  const weekScrollerRef = useRef<HTMLDivElement>(null);

  const monthGrid = useMemo(
    () => getMonthCalendarGrid(now, monthOffset),
    [now, monthOffset],
  );

  const tasksByDate = useMemo(() => {
    const map = new Map<string, DayTaskInfo>();
    for (const task of tasks) {
      if (!task.date) continue;
      const info = map.get(task.date) ?? { total: 0, pending: 0 };
      info.total += 1;
      if (!task.completed) info.pending += 1;
      map.set(task.date, info);
    }
    return map;
  }, [tasks]);

  const pendingCount = useMemo(
    () => tasks.filter((task) => !task.completed).length,
    [tasks],
  );

  // Position the horizontal week scroller at the active week when Week view mounts.
  useEffect(() => {
    if (view !== "week") return;
    const el = weekScrollerRef.current;
    if (!el) return;
    el.scrollTo({
      left: activeWeekIndex * el.clientWidth,
      behavior: "instant" as ScrollBehavior,
    });
    // Only snap into position when switching to Week view or on initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const scrollToWeek = (index: number) => {
    const clamped = Math.max(0, Math.min(weeks.length - 1, index));
    setActiveWeekIndex(clamped);
    const el = weekScrollerRef.current;
    if (el) {
      el.scrollTo({
        left: clamped * el.clientWidth,
        behavior: reduce ? "instant" : "smooth",
      });
    }
  };

  const handleWeekScroll = () => {
    const el = weekScrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const nextIndex = Math.round(el.scrollLeft / el.clientWidth);
    if (
      nextIndex !== activeWeekIndex &&
      nextIndex >= 0 &&
      nextIndex < weeks.length
    ) {
      setActiveWeekIndex(nextIndex);
    }
  };

  const activeWeek = weeks[activeWeekIndex] ?? weeks[currentWeekIndex];
  const weekStart = activeWeek?.weekStart ?? monthGrid.monthStart;
  const weekEnd = activeWeek?.weekEnd ?? monthGrid.monthEnd;

  const activeSelectedDate = useMemo(() => {
    if (!selectedDate || view === "all") return null;
    if (view === "week") {
      return activeWeek?.days.some((day) => day.date === selectedDate)
        ? selectedDate
        : null;
    }
    return selectedDate >= monthGrid.monthStart &&
      selectedDate <= monthGrid.monthEnd
      ? selectedDate
      : null;
  }, [selectedDate, view, activeWeek, monthGrid.monthStart, monthGrid.monthEnd]);

  const weekBuckets = useMemo(
    () => selectTasksForRange(tasks, weekStart, weekEnd, now),
    [tasks, weekStart, weekEnd, now],
  );
  const monthBuckets = useMemo(
    () => selectTasksForSpecificMonth(tasks, monthGrid.monthStart, now),
    [tasks, monthGrid.monthStart, now],
  );
  const allBuckets = useMemo(
    () => selectAllTaskBuckets(tasks, now),
    [tasks, now],
  );

  const weekCount = weekBuckets.pending.length + weekBuckets.completed.length;
  const monthCount =
    monthBuckets.upcoming.length +
    monthBuckets.previous.length +
    monthBuckets.completed.length;

  const sections = useMemo<BucketSection[]>(() => {
    if (activeSelectedDate) {
      const selection = selectTasksForDate(tasks, activeSelectedDate, now);
      const pending =
        activeSelectedDate === today
          ? mergeUniqueTasks(
              selection.pending,
              selectTasksForTimeframe(tasks, "today", now).pending.filter(
                (task) => task.date === null || task.date === today,
              ),
            )
          : selection.pending;
      return [
        {
          title: "Pending Tasks",
          tasks: pending,
          emptyMessage: "No pending tasks for this day.",
          emphasize: true,
        },
        {
          title: "Completed Tasks",
          tasks: selection.completed,
          emptyMessage: "No completed tasks for this day.",
        },
      ];
    }

    if (view === "week") {
      return [
        {
          title: "Pending Tasks",
          tasks: weekBuckets.pending,
          emptyMessage: "No pending tasks this week.",
          emphasize: true,
        },
        {
          title: "Completed Tasks",
          tasks: weekBuckets.completed,
          emptyMessage: "No completed tasks this week.",
        },
      ];
    }

    const isAll = view === "all";
    const buckets = isAll ? allBuckets : monthBuckets;
    const scope = isAll ? "" : ` in ${monthGrid.monthLabel}`;
    return [
      {
        title: "Upcoming Tasks",
        tasks: buckets.upcoming,
        emptyMessage: `No upcoming tasks${scope}.`,
        emphasize: true,
      },
      {
        title: "Previous Tasks",
        tasks: buckets.previous,
        emptyMessage: `No previous pending tasks${scope}.`,
      },
      {
        title: "Completed Tasks",
        tasks: buckets.completed,
        emptyMessage: `No completed tasks${scope}.`,
      },
    ];
  }, [
    activeSelectedDate,
    view,
    tasks,
    now,
    today,
    weekBuckets,
    monthBuckets,
    allBuckets,
    monthGrid.monthLabel,
  ]);

  const visibleCount = sections.reduce((sum, s) => sum + s.tasks.length, 0);

  const handleTabChange = (nextView: TasksView) => {
    setView(nextView);
    if (nextView === "month") {
      setSelectedDate((current) => {
        if (current === null) return null;
        return current >= monthGrid.monthStart && current <= monthGrid.monthEnd
          ? current
          : monthOffset === 0
            ? today
            : null;
      });
    } else if (nextView === "week") {
      setSelectedDate((current) => {
        if (current === null) return null;
        return activeWeek?.days.some((d) => d.date === current)
          ? current
          : today;
      });
    }
  };

  const handleMonthChange = (nextOffset: number) => {
    setMonthOffset(nextOffset);
    setSelectedDate(nextOffset === 0 ? today : null);
  };

  const handleCompletedChange = (taskId: string, completed: boolean) => {
    void run(() => updateTaskCompletion(userId, tasks, taskId, completed));
  };

  const handleSubtaskChange = (
    taskId: string,
    subtaskId: string,
    done: boolean,
  ) => {
    void run(() =>
      updateSubtaskCompletion(userId, tasks, taskId, subtaskId, done),
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskTitle = tasks.find((task) => task.id === taskId)?.title;
    const ok = await run(() => deleteTask(userId, taskId));
    if (ok) {
      toast.success("Task deleted", taskTitle);
    } else {
      toast.error("Could not delete task", "Please try again.");
    }
  };

  const handleSaveEdit = async (values: TaskFormSubmission) => {
    if (!editingTask) return;
    const saved = await run(() =>
      saveTask(userId, buildEditedTask(editingTask, values, userId)),
    );
    if (saved) {
      setEditingTask(null);
      toast.success("Task updated", values.title.trim() || editingTask.title);
    } else {
      toast.error(
        "Could not update task",
        "Please check your details and try again.",
      );
    }
  };

  const headerMonthLabel =
    view === "all"
      ? "All tasks"
      : view === "week"
        ? (activeWeek?.monthLabel ?? monthGrid.monthLabel)
        : monthGrid.monthLabel;

  const periodLabel = activeSelectedDate
    ? formatCompactDate(activeSelectedDate)
    : view === "week"
      ? `${formatCompactDate(weekStart)} – ${formatCompactDate(weekEnd)}`
      : view === "month"
        ? monthGrid.monthLabel
        : "All tasks";

  const emptyTitle = activeSelectedDate
    ? `No tasks on ${formatCompactDate(activeSelectedDate)}`
    : view === "week"
      ? "No tasks this week"
      : view === "month"
        ? `No tasks in ${monthGrid.monthLabel}`
        : "No tasks yet";

  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      {/* Header, same layout as Events */}
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="type-display-lg text-on-dark">Tasks</h1>
          <p className="type-body text-on-dark-muted">
            {pendingCount === 0
              ? "All caught up"
              : `${pendingCount} pending ${pendingCount === 1 ? "task" : "tasks"}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-xs font-semibold text-on-dark ring-1 ring-glass-border/10 sm:text-sm">
            <Calendar aria-hidden="true" size={15} className="text-lime" />
            <span>{headerMonthLabel}</span>
          </span>

          <Link
            href={ADD_TASK_HREF}
            aria-label="Add task"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-ink transition-colors hover:bg-lime-soft active:brightness-95"
          >
            <Plus aria-hidden="true" size={19} strokeWidth={2.25} />
          </Link>
        </div>
      </header>

      {/* Week / Month / All tabs + All-period toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Tasks view"
          className="inline-flex rounded-full bg-surface p-1 ring-1 ring-glass-border/10"
        >
          {VIEW_TABS.map((tab) => {
            const selected = tab.value === view;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-base ease-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  selected
                    ? "bg-lime text-ink"
                    : "text-on-dark-muted hover:text-on-dark",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {view !== "all" && (
          <button
            type="button"
            onClick={() =>
              setSelectedDate(activeSelectedDate === null ? today : null)
            }
            aria-pressed={activeSelectedDate === null}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-colors duration-base ease-standard",
              activeSelectedDate === null
                ? "bg-lime/10 text-lime ring-lime/40"
                : "bg-surface text-on-dark-muted ring-glass-border/10 hover:bg-surface-raised hover:text-on-dark",
            )}
          >
            {view === "week"
              ? `All this week (${weekCount})`
              : `All ${monthGrid.monthLabel} (${monthCount})`}
          </button>
        )}
      </div>

      {/* Calendar: horizontally scrollable weeks OR month grid */}
      {view === "week" && (
        <section aria-label="Weekly calendar" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-on-dark-muted">
              {formatCompactDate(weekStart)} – {formatCompactDate(weekEnd)}
            </span>

            <div className="flex items-center gap-2">
              {activeWeekIndex !== currentWeekIndex && (
                <button
                  type="button"
                  onClick={() => {
                    scrollToWeek(currentWeekIndex);
                    setSelectedDate(today);
                  }}
                  className="rounded-full bg-lime/10 px-3 py-1 text-xs font-semibold text-lime ring-1 ring-lime/30 transition-colors hover:bg-lime/25"
                >
                  This week
                </button>
              )}
              <button
                type="button"
                aria-label="Previous week"
                disabled={activeWeekIndex <= 0}
                onClick={() => scrollToWeek(activeWeekIndex - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-on-dark transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <button
                type="button"
                aria-label="Next week"
                disabled={activeWeekIndex >= weeks.length - 1}
                onClick={() => scrollToWeek(activeWeekIndex + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-on-dark transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>

          <div
            ref={weekScrollerRef}
            onScroll={handleWeekScroll}
            className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {weeks.map((week) => (
              <div
                key={week.weekStart}
                className="grid w-full shrink-0 snap-start grid-cols-7 gap-2 sm:gap-2"
              >
                {week.days.map((day) => {
                  const count = tasksByDate.get(day.date)?.total ?? 0;
                  const isSelected = activeSelectedDate === day.date;

                  return (
                    <button
                      key={day.date}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`${formatCompactDate(day.date)}, ${pluralTasks(count)}`}
                      onClick={() => setSelectedDate(day.date)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-3 transition-all duration-base ease-standard sm:rounded-full sm:py-3",
                        isSelected
                          ? "bg-lime text-ink"
                          : day.isToday
                            ? "bg-surface-raised text-on-dark ring-1 ring-ring"
                            : "bg-surface text-on-dark ring-1 ring-glass-border/10 hover:bg-surface-raised",
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          isSelected ? "text-ink/80" : "text-on-dark-muted",
                        )}
                      >
                        {day.weekdayShort}
                      </span>
                      <span className="text-base font-bold leading-none sm:text-lg">
                        {day.dayNumber}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      {view === "month" && (
        <section
          aria-label={`${monthGrid.monthLabel} calendar`}
          className="surface-card p-3 sm:p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-on-dark">
              {monthGrid.monthLabel}
            </h2>
            <div className="flex items-center gap-2">
              {monthOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => handleMonthChange(0)}
                  className="rounded-full bg-lime/10 px-3 py-1 text-xs font-semibold text-lime ring-1 ring-lime/30 transition-colors hover:bg-lime/25"
                >
                  This month
                </button>
              )}
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => handleMonthChange(monthOffset - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-on-dark transition-colors hover:bg-line"
              >
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => handleMonthChange(monthOffset + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-on-dark transition-colors hover:bg-line"
              >
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAY_HEADERS.map((weekday) => (
              <div
                key={weekday}
                className="py-1 text-center text-2xs font-bold uppercase tracking-wide text-on-dark-muted"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: monthGrid.leadingEmptyCount }, (_, i) => (
              <div key={`empty-${i}`} aria-hidden="true" />
            ))}

            {monthGrid.days.map((day) => {
              const info = tasksByDate.get(day.date);
              const count = info?.total ?? 0;
              const isSelected = activeSelectedDate === day.date;
              const hasPending = (info?.pending ?? 0) > 0;

              return (
                <button
                  key={day.date}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${formatCompactDate(day.date)}, ${pluralTasks(count)}`}
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    "flex min-h-[46px] flex-col items-center justify-center gap-1 rounded-md py-2 transition-colors duration-base ease-standard sm:min-h-[54px]",
                    isSelected
                      ? "bg-lime text-ink"
                      : day.isToday
                        ? "bg-surface-raised text-on-dark ring-1 ring-ring"
                        : "bg-background/40 text-on-dark hover:bg-surface-raised",
                  )}
                >
                  <span className="text-sm font-bold leading-none">
                    {day.dayNumber}
                  </span>
                  <span className="flex h-2 items-center gap-1">
                    {count > 0 && (
                      <>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-2 w-2 rounded-full",
                            isSelected
                              ? "bg-ink"
                              : hasPending
                                ? "bg-lime"
                                : "bg-on-dark-muted/60",
                          )}
                        />
                        {count > 1 && (
                          <span
                            className={cn(
                              "text-xs font-bold leading-none",
                              isSelected
                                ? "text-ink"
                                : hasPending
                                  ? "text-lime"
                                  : "text-on-dark-muted",
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {saveError && (
        <p
          role="alert"
          className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/25"
        >
          {saveError}
        </p>
      )}

      {/* Active day / period heading */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <h2 className="text-base font-semibold text-on-dark">{periodLabel}</h2>
        <span className="text-xs font-medium text-on-dark-muted">
          {pluralTasks(visibleCount)}
        </span>
      </div>

      {visibleCount > 0 ? (
        <div className="flex flex-col gap-6 lg:gap-8">
          {sections.map((section) => (
            <TaskBucketSection
              key={section.title}
              title={section.title}
              tasks={section.tasks}
              emptyMessage={section.emptyMessage}
              emphasize={section.emphasize}
              onCompletedChange={handleCompletedChange}
              onSubtaskChange={handleSubtaskChange}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      ) : (
        <motion.section
          key={`empty-${view}-${monthOffset}-${activeWeekIndex}-${activeSelectedDate ?? "all"}`}
          aria-label="No tasks"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduce ? 0.15 : 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="surface-card flex flex-col items-start gap-4 p-6"
        >
          <h3 className="text-lg font-semibold text-on-dark">{emptyTitle}</h3>
        </motion.section>
      )}

      <Modal
        open={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
        size="lg"
      >
        {editingTask && (
          <TaskEditForm
            key={editingTask.id}
            task={editingTask}
            saving={savingEdit}
            onSave={(values) => void handleSaveEdit(values)}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function TaskBucketSection({
  title,
  tasks,
  emptyMessage,
  emphasize = false,
  onCompletedChange,
  onSubtaskChange,
  onEdit,
  onDelete,
}: {
  title: string;
  tasks: readonly Task[];
  emptyMessage: string;
  /** Lime count pill for the actionable bucket (pending / upcoming). */
  emphasize?: boolean;
  onCompletedChange: (taskId: string, completed: boolean) => void;
  onSubtaskChange: (taskId: string, subtaskId: string, done: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="type-h3 py-1 text-on-dark">{title}</h3>
        <span
          className={cn(
            "inline-flex min-w-8 items-center justify-center rounded-full px-3 py-1 text-sm font-semibold tabular-nums",
            emphasize
              ? "bg-lime text-ink"
              : "bg-surface-raised text-on-dark-muted",
          )}
        >
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-glass-border/25 px-5 py-8 text-center text-base font-medium text-on-dark-muted">
          {emptyMessage}
        </p>
      ) : (
        <motion.ul
          layout
          className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {tasks.map((task) => (
              <motion.li
                key={task.id}
                id={`task-${task.id}`}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.94,
                  transition: { duration: 0.16 },
                }}
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
              >
                <ActiveTaskCard
                  task={task}
                  onCompletedChange={onCompletedChange}
                  onSubtaskChange={onSubtaskChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </section>
  );
}

function mergeUniqueTasks(
  primary: readonly Task[],
  secondary: readonly Task[],
): Task[] {
  const seen = new Set(primary.map((task) => task.id));
  const merged = [...primary];
  for (const task of secondary) {
    if (!seen.has(task.id)) {
      seen.add(task.id);
      merged.push(task);
    }
  }
  return merged;
}
