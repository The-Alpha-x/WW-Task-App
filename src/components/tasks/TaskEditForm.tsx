"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTaskFormSchema,
  taskToFormValues,
  type TaskFormSubmission,
  type TaskFormValues,
} from "@/lib/tasks/form";
import type { Task } from "@/types/task";
import { TaskFormFields } from "./TaskFormFields";

interface TaskEditFormProps {
  task: Task;
  saving?: boolean;
  /** Called with validated, trimmed values. Persisting is the caller's job. */
  onSave: (values: TaskFormSubmission) => void;
  onCancel: () => void;
}

/**
 * Edit form: the shared task fields pre-filled from the task. Subtask ids
 * and done-state come along, so saving never drops existing subtasks.
 */
export function TaskEditForm({
  task,
  saving = false,
  onSave,
  onCancel,
}: TaskEditFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(createTaskFormSchema({ originalDate: task.date })),
    defaultValues: taskToFormValues(task),
  });

  const handleSubmit = form.handleSubmit((values) => {
    if (!saving) onSave(values);
  });

  return (
    <form
      className="flex w-full flex-col gap-5"
      noValidate
      onSubmit={handleSubmit}
    >
      <TaskFormFields form={form} editing />

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-full px-5 py-3 text-sm font-semibold text-on-dark-muted ring-1 ring-glass-border/15 transition-colors hover:bg-surface-raised/60 hover:text-on-dark disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-lime px-5 py-3 text-sm font-bold text-ink shadow-lime-pill transition-all hover:brightness-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime active:scale-[0.98]"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
