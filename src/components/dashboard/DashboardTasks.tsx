"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
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
import { ActiveTaskCard } from "@/components/tasks/ActiveTaskCard";
import { TaskEditForm } from "@/components/tasks/TaskEditForm";
import type { Task } from "@/types/task";

export interface DashboardTasksProps {
  tasks: readonly Task[];
  userId: string;
  className?: string;
}

/**
 * Dashboard task section using the same ActiveTaskCard as the Tasks page.
 * Supports inline subtask toggling, edit modal, delete confirmation,
 * and hold-to-complete — all wired to the same task service functions.
 */
export function DashboardTasks({ tasks, userId, className }: DashboardTasksProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { run, pending: savingEdit, error: saveError } = useAction(
    "Could not update this task.",
  );

  const handleCompletedChange = (taskId: string, completed: boolean) => {
    void run(() => updateTaskCompletion(userId, tasks, taskId, completed));
  };

  const handleSubtaskChange = (taskId: string, subtaskId: string, done: boolean) => {
    void run(() => updateSubtaskCompletion(userId, tasks, taskId, subtaskId, done));
  };

  const handleDelete = async (taskId: string) => {
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
    <section
      aria-label="Tasks"
      className={cn("flex flex-col gap-4", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-on-dark md:text-xl py-3 md:py-4">
          Today&apos;s Tasks
        </h2>
        <span className="rounded-full bg-surface-raised/60 px-3 py-1 text-xs font-bold tabular-nums text-lime/80">
          {tasks.length}
        </span>
      </div>

      {saveError && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/25"
        >
          {saveError}
        </p>
      )}

      {tasks.length === 0 ? (
        <p className="rounded-md bg-surface/30 px-4 py-4 text-sm font-medium text-on-dark-muted ring-1 ring-glass-border/10">
          No open tasks right now. Great work!
        </p>
      ) : (
        <motion.ul
          layout
          className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-1"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {tasks.map((task) => (
              <motion.li
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.16 } }}
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
              >
                <ActiveTaskCard
                  task={task}
                  onCompletedChange={handleCompletedChange}
                  onSubtaskChange={handleSubtaskChange}
                  onEdit={setEditingTask}
                  onDelete={handleDelete}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
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
    </section>
  );
}
