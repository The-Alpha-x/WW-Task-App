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
import { FormActions } from "@/components/ui/FormActions";
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
      className="flex w-full flex-col gap-5 md:gap-6"
      noValidate
      onSubmit={handleSubmit}
    >
      <TaskFormFields form={form} editing />

      <FormActions
        saving={saving}
        submitLabel="Save changes"
        savingLabel="Saving…"
        onCancel={onCancel}
      />
    </form>
  );
}
