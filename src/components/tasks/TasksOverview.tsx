"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAction } from "@/hooks/useAction";
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
import {
  addDaysToDate,
  formatCompactDate,
  getLocalDate,
  parseLocalDate,
} from "@/lib/date-time";
import {
  formatMonthYear,
  getMonthCalendarDays,
  getWeekDays,
  selectAllTaskBuckets,
  selectTasksForDate,
  selectTasksForSpecificMonth,
  selectTasksForTimeframe,
  shiftMonthDate,
} from "@/lib/tasks/filters";
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

type TasksViewMode = "day" | "month" | "all";

const VIEW_MODES: readonly { value: TasksViewMode; label: string }[] = [
  { value: "day", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function TasksOverview({
  tasks,
  userId,
}: TasksOverviewProps) {
  const reduceMotion = useReducedMotion();
  const today = getLocalDate();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [viewMode, setViewMode] = useState<TasksViewMode>("day");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { run, pending: savingEdit, error: saveError } = useAction(
    "Could not update this task.",
  );

  const anchorDateObj = useMemo(
    () => parseLocalDate(selectedDate) ?? new Date(),
    [selectedDate],
  );
  const weekDays = useMemo(() => getWeekDays(anchorDateObj), [anchorDateObj]);
  const monthDays = useMemo(
    () => getMonthCalendarDays(selectedDate),
    [selectedDate],
  );

  const datesWithTasks = useMemo(() => {
    const set = new Set<string>();
    for (const task of tasks) {
      if (task.date) set.add(task.date);
    }
    return set;
  }, [tasks]);

  const isTodaySelected = selectedDate === today;
  const isCurrentMonth = selectedDate.slice(0, 7) === today.slice(0, 7);

  const dateSelection = selectTasksForDate(tasks, selectedDate);
  const pendingDayTasks = isTodaySelected
    ? mergeUniqueTasks(
      dateSelection.pending,
      selectTasksForTimeframe(tasks, "today").pending.filter(
        (t) => t.date === null || t.date === today,
      ),
    )
    : dateSelection.pending;

  const monthBuckets = useMemo(
    () => selectTasksForSpecificMonth(tasks, selectedDate),
    [tasks, selectedDate],
  );
  const allBuckets = useMemo(() => selectAllTaskBuckets(tasks), [tasks]);

  const handleShiftMonth = (delta: number) => {
    const nextMonthStart = shiftMonthDate(selectedDate, delta);
    setSelectedDate(
      nextMonthStart.slice(0, 7) === today.slice(0, 7) ? today : nextMonthStart,
    );
  };

  const handleShiftWeek = (deltaWeeks: number) => {
    setSelectedDate((prev) => addDaysToDate(prev, deltaWeeks * 7));
  };

  const handleJumpToday = () => {
    setSelectedDate(today);
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
      toast.error("Could not update task", "Please check your details and try again.");
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 lg:gap-8">
      {/* <TasksHeader userName={userName} avatarSrc={avatarSrc} /> */}

      {/* Month switcher + view mode bar */}
      <div className="flex flex-wrap items-center  justify-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          {viewMode !== "all" ? (
            <>
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => handleShiftMonth(-1)}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface/50 text-on-dark-muted ring-1 ring-glass-border/10 transition-colors hover:bg-surface-raised/60 hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
              >
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <span className="min-w-[9rem] text-center text-sm font-bold text-on-dark md:text-base">
                {formatMonthYear(selectedDate)}
              </span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => handleShiftMonth(1)}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface/50 text-on-dark-muted ring-1 ring-glass-border/10 transition-colors hover:bg-surface-raised/60 hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
              >
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </>
          ) : (
            <p className="text-base font-bold text-on-dark md:text-lg">
            </p>
          )}

          {/* {(!isTodaySelected || !isCurrentMonth) && viewMode !== "all" && (
            <button
              type="button"
              onClick={handleJumpToday}
              className="ml-1 rounded-full bg-lime/15 px-3 py-2 text-xs font-bold text-lime ring-1 ring-lime/30 transition-colors hover:bg-lime/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
            >
              Today
            </button>
          )} */}
        </div>

        <div
          role="tablist"
          aria-label="Tasks view mode"
          className="inline-flex items-center rounded-full bg-surface/50 p-1 ring-1 ring-glass-border/10"
        >
          {(!isTodaySelected || !isCurrentMonth) && viewMode !== "all" && (
            <button
              type="button"
              onClick={handleJumpToday}
              className="relative rounded-full px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime md:px-4 md:text-sm text-on-dark-muted hover:text-on-dark">
              Today
            </button>
          )}
          {VIEW_MODES.map((mode) => {
            const active = viewMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setViewMode(mode.value)}
                className={cn(
                  "relative rounded-full px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime md:px-4 md:text-sm",
                  active ? "text-ink" : "text-on-dark-muted hover:text-on-dark",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tasks-view-mode-pill"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 380, damping: 30 }
                    }
                    className="absolute inset-0 rounded-full bg-lime"
                  />
                )}
                <span className="relative z-10">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Week 7-day pill strip */}
      {viewMode === "day" && (
        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => handleShiftWeek(-1)}
            className="grid h-9 w-5 shrink-0 place-items-center rounded-full bg-surface/40 text-on-dark-muted ring-1 ring-glass-border/10 transition-colors hover:bg-surface/70 hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime md:h-10 md:w-10"
          >
            <ChevronLeft aria-hidden="true" size={16} />
          </button>

          <div
            role="group"
            aria-label="Select day of the week"
            className="grid flex-1 grid-cols-7 gap-2 sm:gap-2 md:gap-3"
          >
            {weekDays.map((day) => {
              const selected = day.date === selectedDate;
              const hasItems = datesWithTasks.has(day.date);
              return (
                <button
                  key={day.date}
                  type="button"
                  aria-pressed={selected}
                  aria-label={day.fullLabel}
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 rounded-full py-3 text-center transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime md:flex-row md:gap-2 md:rounded-xl md:py-4",
                    selected
                      ? "text-ink"
                      : "bg-surface/40 text-on-dark-muted ring-1 ring-glass-border/10 hover:bg-surface/70 hover:text-on-dark",
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="tasks-week-day-pill"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                            type: "spring",
                            stiffness: 360,
                            damping: 30,
                          }
                      }
                      className="absolute inset-0 rounded-full bg-lime shadow-lime-pill md:rounded-xl"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative z-10 h-2 w-2 rounded-full",
                      selected
                        ? "bg-ink"
                        : hasItems
                          ? "bg-lime"
                          : "bg-on-dark-muted/60",
                    )}
                  />
                  <span
                    className={cn(
                      "relative z-10 text-2xs font-medium md:text-xs",
                      selected ? "text-ink/80" : "text-on-dark-muted",
                    )}
                  >
                    {day.shortLabel}
                  </span>
                  <span
                    className={cn(
                      "relative z-10 text-base font-bold tabular-nums leading-none md:text-lg",
                      selected ? "text-ink" : "text-on-dark",
                    )}
                  >
                    {day.dayNumber}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Next week"
            onClick={() => handleShiftWeek(1)}
            className="grid h-9 w-5 shrink-0 place-items-center rounded-full bg-surface/40 text-on-dark-muted ring-1 ring-glass-border/10 transition-colors hover:bg-surface/70 hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime md:h-10 md:w-10"
          >
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        </div>
      )}

      {saveError && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/25"
        >
          {saveError}
        </p>
      )}

      {/* WEEK / DAY VIEW: Pending & Completed tasks */}
      {viewMode === "day" && (
        <div className="flex flex-col gap-6 lg:gap-8">
          <TaskBucketSection
            title="Pending Tasks"
            tasks={pendingDayTasks}
            emptyMessage="No pending tasks for this day."
            onCompletedChange={handleCompletedChange}
            onSubtaskChange={handleSubtaskChange}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
          />

          <TaskBucketSection
            title="Completed Tasks"
            tasks={dateSelection.completed}
            emptyMessage="No completed tasks for this day."
            onCompletedChange={handleCompletedChange}
            onSubtaskChange={handleSubtaskChange}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
          />
        </div>
      )}

      {/* MONTH VIEW: Calendar + Upcoming, Previous & Completed tasks */}
      {viewMode === "month" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[21rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          <section
            aria-label={`Calendar for ${formatMonthYear(selectedDate)}`}
            className="rounded-md bg-surface/35 p-4 ring-1 ring-glass-border/10 lg:sticky lg:top-8 lg:p-5 w-full"
          >
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_HEADERS.map((label) => (
                <span
                  key={label}
                  className="pb-2 text-2xs font-semibold uppercase tracking-wide text-on-dark-muted"
                >
                  {label}
                </span>
              ))}
              {monthDays.map((cell) => {
                const selected = cell.date === selectedDate;
                const hasItems = datesWithTasks.has(cell.date);
                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(cell.date);
                      setViewMode("day");
                    }}
                    aria-label={formatCompactDate(cell.date)}
                    aria-pressed={selected}
                    className={cn(
                      "relative flex h-10 flex-col items-center justify-center rounded-sm text-xs font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime",
                      selected
                        ? "bg-lime text-ink shadow-lime-pill"
                        : cell.isToday
                          ? "bg-surface-raised/80 text-lime ring-1 ring-lime/40"
                          : cell.inCurrentMonth
                            ? "text-on-dark hover:bg-surface-raised/60"
                            : "text-on-dark-muted/40 hover:bg-surface-raised/40",
                    )}
                  >
                    <span>{cell.dayNumber}</span>
                    {hasItems && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-1 h-1 w-1 rounded-full",
                          selected ? "bg-ink" : "bg-lime",
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col gap-6 lg:gap-8">
            <TaskBucketSection
              title="Upcoming Tasks"
              tasks={monthBuckets.upcoming}
              emptyMessage={`No upcoming tasks in ${formatMonthYear(selectedDate)}.`}
              gridClassName="md:grid-cols-2"
              onCompletedChange={handleCompletedChange}
              onSubtaskChange={handleSubtaskChange}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />

            <TaskBucketSection
              title="Previous Tasks"
              tasks={monthBuckets.previous}
              emptyMessage={`No previous pending tasks in ${formatMonthYear(selectedDate)}.`}
              gridClassName="md:grid-cols-2"
              onCompletedChange={handleCompletedChange}
              onSubtaskChange={handleSubtaskChange}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />

            <TaskBucketSection
              title="Completed Tasks"
              tasks={monthBuckets.completed}
              emptyMessage={`No completed tasks in ${formatMonthYear(selectedDate)}.`}
              gridClassName="md:grid-cols-2"
              onCompletedChange={handleCompletedChange}
              onSubtaskChange={handleSubtaskChange}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />
          </div>
        </div>
      )}

      {/* ALL VIEW: Upcoming, Previous & Completed across all months */}
      {viewMode === "all" && (
        <div className="flex flex-col gap-6 lg:gap-8">
          <TaskBucketSection
            title="Upcoming Tasks"
            tasks={allBuckets.upcoming}
            emptyMessage="No upcoming tasks."
            onCompletedChange={handleCompletedChange}
            onSubtaskChange={handleSubtaskChange}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
          />

          <TaskBucketSection
            title="Previous Tasks"
            tasks={allBuckets.previous}
            emptyMessage="No previous pending tasks."
            onCompletedChange={handleCompletedChange}
            onSubtaskChange={handleSubtaskChange}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
          />

          <TaskBucketSection
            title="Completed Tasks"
            tasks={allBuckets.completed}
            emptyMessage="No completed tasks."
            onCompletedChange={handleCompletedChange}
            onSubtaskChange={handleSubtaskChange}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
          />
        </div>
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
  gridClassName = "md:grid-cols-2 xl:grid-cols-3",
  onCompletedChange,
  onSubtaskChange,
  onEdit,
  onDelete,
}: {
  title: string;
  tasks: readonly Task[];
  emptyMessage: string;
  gridClassName?: string;
  onCompletedChange: (taskId: string, completed: boolean) => void;
  onSubtaskChange: (taskId: string, subtaskId: string, done: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-on-dark md:text-xl py-3 md:py-4">{title}</h2>
        <span className="rounded-full bg-surface-raised/60 px-3 py-1 text-xs font-bold tabular-nums text-lime/80">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-md bg-surface/30 px-4 py-4 text-sm font-medium text-on-dark-muted ring-1 ring-glass-border/10">
          {emptyMessage}
        </p>
      ) : (
        <motion.ul
          layout
          className={cn("grid grid-cols-1 items-start gap-4", gridClassName)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {tasks.map((task) => (
              <motion.li
                key={task.id}
                id={`task-${task.id}`}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.16 } }}
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
