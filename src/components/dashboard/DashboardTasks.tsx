"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAction } from "@/hooks/useAction";
import { toast } from "@/components/ui/Toaster";
import { updateSubtaskCompletion, updateTaskCompletion } from "@/services/tasks";
import { ActiveTaskCard } from "@/components/tasks/ActiveTaskCard";
import type { Task } from "@/types/task";

export interface DashboardTasksProps {
  tasks: readonly Task[];
  userId: string;
  userDisplayName?: string | null;
  className?: string;
}

/**
 * Simplified dashboard task section — today's open tasks with inline subtask
 * toggling and hold-to-complete only (no edit/delete buttons), scroll-triggered
 * entrance animations, and a "View all tasks" link.
 */
export function DashboardTasks({
  tasks,
  userId,
  userDisplayName = null,
  className,
}: DashboardTasksProps) {
  const reduce = useReducedMotion();
  const { run, error: saveError } = useAction("Could not update this task.");

  const handleCompletedChange = async (taskId: string, completed: boolean) => {
    const taskTitle = tasks.find((task) => task.id === taskId)?.title;
    const updated = await run(() =>
      updateTaskCompletion(userId, tasks, taskId, completed),
    );
    if (updated) {
      toast.success(completed ? "Task completed" : "Task reopened", taskTitle);
    } else {
      toast.error("Could not update task", "Please try again.");
    }
  };

  const handleSubtaskChange = (taskId: string, subtaskId: string, done: boolean) => {
    void run(() => updateSubtaskCompletion(userId, tasks, taskId, subtaskId, done));
  };

  return (
    <section
      aria-label="Today's Tasks"
      className={cn("flex flex-col gap-4", className)}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="flex items-center justify-between gap-2"
      >
        <h2 className="text-xl font-bold text-on-dark md:text-2xl">
          Today&apos;s Tasks
        </h2>
        <span className="rounded-full bg-surface-raised/60 px-3 py-1 text-xs font-bold tabular-nums text-lime/80">
          {tasks.length}
        </span>
      </motion.div>

      {saveError && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/25"
        >
          {saveError}
        </p>
      )}

      {tasks.length === 0 ? (
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-md bg-surface/30 px-4 py-4 text-sm font-medium text-on-dark-muted ring-1 ring-glass-border/10"
        >
          No tasks remaining for today. Enjoy your day!
        </motion.p>
      ) : (
        <motion.ul layout className="grid grid-cols-1 items-start gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {tasks.map((task, index) => (
              <motion.li
                key={task.id}
                layout
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{
                  type: "spring",
                  stiffness: 360,
                  damping: 28,
                  delay: Math.min(index * 0.05, 0.25),
                }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.16 } }}
              >
                <ActiveTaskCard
                  task={task}
                  userDisplayName={userDisplayName}
                  onCompletedChange={(id, completed) =>
                    void handleCompletedChange(id, completed)
                  }
                  onSubtaskChange={handleSubtaskChange}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <div>
        <Link
          href="/tasks"
          className="group inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-semibold text-lime transition-colors hover:text-lime/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          View all tasks
          <ArrowRight
            aria-hidden="true"
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
}
