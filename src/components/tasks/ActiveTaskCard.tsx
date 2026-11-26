"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Calendar, Check, ChevronDown, Clock, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatShortDate, formatTime } from "@/lib/date-time";
import { countDoneSubtasks } from "@/lib/tasks/display";
import type { Task } from "@/types/task";

export interface ActiveTaskCardProps {
  task: Task;
  onCompletedChange: (taskId: string, completed: boolean) => void;
  onSubtaskChange: (taskId: string, subtaskId: string, done: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const LONG_PRESS_MS = 650;
const SUCCESS_HOLD_MS = 450;
const RING_RADIUS = 24;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type HoldPhase = "idle" | "pressing" | "success";

/**
 * Dark task card with inline tickable subtasks, blurred hold-to-complete
 * progress overlay with 100% success animation, edit link, and delete action.
 */
export function ActiveTaskCard({
  task,
  onCompletedChange,
  onSubtaskChange,
  onEdit,
  onDelete,
}: ActiveTaskCardProps) {
  const reduceMotion = useReducedMotion();
  const [holdPhase, setHoldPhase] = useState<HoldPhase>("idle");
  const [holdProgress, setHoldProgress] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(false);

  const rafRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const cancelAnimationFrameLoop = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const resetPress = () => {
    cancelAnimationFrameLoop();
    if (holdPhase === "pressing") {
      setHoldPhase("idle");
      setHoldProgress(0);
    }
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrameLoop();
      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const handleCardPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (holdPhase === "success") return;

    startTimeRef.current = performance.now();
    setHoldPhase("pressing");
    setHoldProgress(0);

    const step = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(100, (elapsed / LONG_PRESS_MS) * 100);
      setHoldProgress(pct);

      if (pct >= 100) {
        rafRef.current = null;
        setHoldPhase("success");
        const nextCompleted = !task.completed;
        successTimerRef.current = window.setTimeout(() => {
          successTimerRef.current = null;
          onCompletedChange(task.id, nextCompleted);
          setHoldPhase("idle");
          setHoldProgress(0);
        }, reduceMotion ? 150 : SUCCESS_HOLD_MS);
        return;
      }

      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);
  };

  const stopCardPress = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const totalSubtasks = task.subtasks.length;
  const doneSubtasks = countDoneSubtasks(task);
  const progressPercent = task.completed
    ? 100
    : totalSubtasks > 0
      ? Math.round((doneSubtasks / totalSubtasks) * 100)
      : 0;

  const clampedThumb = Math.max(2, Math.min(98, progressPercent));
  const clampedLabel = Math.max(6, Math.min(94, progressPercent));

  const subtitle =
    task.description.trim() ||
    (task.type === "shared" ? "Shared Task" : "Personal Task");
  const dueBadge = task.time
    ?  (<span className="flex items-center gap-1">
         <Clock aria-hidden="true" className="text-lime" size={14} />
         {formatTime(task.time)}
       </span>)
    : task.date
      ? 
      (<span className="flex items-center gap-1">
         <Calendar aria-hidden="true" className="text-lime" size={14} />
         {formatShortDate(task.date)}
       </span>)
      : null;

  const isHoldingOrSuccess = holdPhase !== "idle";
  const ringOffset =
    RING_CIRCUMFERENCE - (holdProgress / 100) * RING_CIRCUMFERENCE;

  return (
    <article
      onPointerDown={handleCardPointerDown}
      onPointerUp={resetPress}
      onPointerCancel={resetPress}
      onPointerLeave={resetPress}
      aria-description={`Hold to ${task.completed ? "reopen" : "mark complete"}`}
      className={cn(
        "relative select-none overflow-hidden rounded-md bg-surface/40 p-4 ring-1 ring-glass-border/10 transition-all duration-fast ease-standard hover:bg-surface/65",
        holdPhase === "pressing" && "scale-[0.985] ring-lime/60",
        holdPhase === "success" && "ring-lime shadow-lime-pill",
        task.completed && holdPhase === "idle" && "opacity-75",
      )}
    >
      {/* Card content — blurs smoothly during hold & success */}
      <div
        className={cn(
          "transition-all duration-150",
          isHoldingOrSuccess && "scale-[0.98] opacity-40 blur-sm",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs font-medium text-blue">
            {subtitle}
          </p>

          <div
            className="relative z-10 flex shrink-0 items-center gap-2"
            onPointerDown={stopCardPress}
          >
            {confirmingDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(false);
                    onDelete(task.id);
                  }}
                  className="rounded-full bg-danger px-4 py-2 text-xs font-bold text-on-dark transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-full bg-surface-raised px-4 py-2 text-xs font-bold text-on-dark-muted transition-colors hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  aria-label={`Edit ${task.title}`}
                  className="grid h-9 w-9 p-2 place-items-center rounded-full bg-surface-raised/70 text-on-dark-muted transition-colors hover:bg-surface-raised hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
                >
                  <Pencil aria-hidden="true" size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  aria-label={`Delete ${task.title}`}
                  className="grid h-9 w-9 p-2 place-items-center rounded-full bg-danger/70 text-on-dark-muted transition-colors hover:bg-danger/20 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                >
                  <Trash2 aria-hidden="true" size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        <h3
          className={cn(
            "mt-1 truncate text-base font-bold text-on-dark",
            task.completed && "text-on-dark-muted line-through",
          )}
        >
          {task.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs bg-surface-raised/70 font-medium text-sage">
              {task.type === "shared" ? "Shared" : "Personal"}
            </span>
            {dueBadge && (
              <span className="inline-flex items-center rounded-full bg-surface-raised/70 px-3 py-1 text-xs font-medium text-on-dark-muted">
                {dueBadge}
              </span>
            )}
          </div>

          <span className="text-2xs font-medium text-on-dark-muted/80">
            {totalSubtasks > 0
              ? `${doneSubtasks}/${totalSubtasks} sub ${totalSubtasks === 1 ? "task" : "tasks"}`
              : task.completed
                ? "Hold to reopen"
                : "Hold to complete"}
          </span>
        </div>

        {totalSubtasks > 0 && (
          <div
            className="relative z-10 mt-3 border-t border-glass-border/10 pt-3"
            onPointerDown={stopCardPress}
          >
            {/* Toggle button */}
            <button
              type="button"
              onClick={() => setSubtasksOpen((o) => !o)}
              aria-expanded={subtasksOpen}
              className="flex w-full items-center justify-between gap-2 rounded-sm py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
            >
              <span className="text-xs font-semibold text-on-dark-muted">
                Subtasks ({doneSubtasks}/{totalSubtasks})
              </span>
              <ChevronDown
                aria-hidden="true"
                size={14}
                className={cn(
                  "shrink-0 text-on-dark-muted transition-transform duration-200",
                  subtasksOpen && "rotate-180",
                )}
              />
            </button>

            {/* Animated subtask list */}
            <AnimatePresence initial={false}>
              {subtasksOpen && (
                <motion.ul
                  key="subtask-list"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                  aria-label={`Subtasks for ${task.title}`}
                  className="mt-2 flex flex-col gap-2"
                >
                  {task.subtasks.map((subtask) => (
                    <li key={subtask.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={subtask.done}
                        onClick={() =>
                          onSubtaskChange(task.id, subtask.id, !subtask.done)
                        }
                        className="flex w-full items-center gap-3 rounded-sm py-1 text-left transition-colors hover:bg-surface-raised/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors",
                            subtask.done
                              ? "border-blue bg-blue text-ink"
                              : "border-on-dark-muted/50 bg-transparent",
                          )}
                        >
                          {subtask.done && <Check size={11} strokeWidth={3} />}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-xs font-medium px-1 py-1 transition-colors",
                            subtask.done
                              ? "text-on-dark-muted line-through"
                              : "text-on-dark",
                          )}
                        >
                          {subtask.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-4">
          <div className="relative h-4">
            <span
              className="absolute bottom-0 -translate-x-1/2 text-[11px] font-medium tabular-nums text-on-dark-muted"
              style={{ left: `${clampedLabel}%` }}
            >
              {progressPercent}%
            </span>
          </div>
          <div className="relative mt-1 h-1 w-full rounded-full bg-on-dark/15">
            <div
              className="h-full rounded-full bg-blue transition-all duration-base ease-standard"
              style={{ width: `${progressPercent}%` }}
            />
            <span
              aria-hidden="true"
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue shadow-blue-pill transition-all duration-base ease-standard"
              style={{ left: `${clampedThumb}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hold-to-complete progress & 100% success animation overlay */}
      <AnimatePresence>
        {isHoldingOrSuccess && (
          <motion.div
            key="hold-overlay"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/55 backdrop-blur-sm"
          >
            {holdPhase === "pressing" ? (
              <>
                <div className="relative grid h-16 w-16 place-items-center">
                  <svg
                    viewBox="0 0 60 60"
                    className="h-full w-full -rotate-90"
                    aria-hidden="true"
                  >
                    <circle
                      cx="30"
                      cy="30"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="rgb(var(--color-on-dark) / 0.15)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="30"
                      cy="30"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="rgb(var(--color-lime))"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <span className="absolute text-xs font-bold tabular-nums text-lime">
                    {Math.round(holdProgress)}%
                  </span>
                </div>
                <p className="text-xs font-bold tracking-wide text-on-dark">
                  {task.completed ? "Hold to reopen..." : "Hold to complete..."}
                </p>
              </>
            ) : (
              <motion.div
                initial={reduceMotion ? false : { scale: 0.65, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="flex flex-col items-center gap-2"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-lime text-ink shadow-glow">
                  <Check aria-hidden="true" size={28} strokeWidth={3} />
                </span>
                <p className="text-sm font-bold text-lime">
                  {task.completed ? "Reopened!" : "Completed!"}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
