"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  getMinTaskDate,
  TASK_DESCRIPTION_MAX,
  TASK_TITLE_MAX,
  type TaskFormValues,
} from "@/lib/tasks/form";
import { SubtaskListField } from "./SubtaskListField";
import { TaskTypeField } from "./TaskTypeField";

export interface TaskFormFieldsProps {
  form: UseFormReturn<TaskFormValues>;
  /** Edit mode: show subtask checkboxes and allow keeping an existing date. */
  editing?: boolean;
  /** Earliest selectable date for new dates; also the edit-mode rule. */
  minDate?: string;
}

/**
 * Shared task form fields in `.form-section` cards, used by both AddTask
 * and TaskEditForm so create and edit stay visually identical.
 */
export function TaskFormFields({
  form,
  editing = false,
  minDate = getMinTaskDate(),
}: TaskFormFieldsProps) {
  const reduce = useReducedMotion();
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <>
      <section
        aria-label="Task details"
        className="form-section"
      >
        <h2 className="form-section__title">
          Details
        </h2>

        <Input
          label="Task title"
          tone="dark"
          {...register("title")}
          error={errors.title?.message}
          placeholder="e.g. Review the project brief"
          maxLength={TASK_TITLE_MAX}
          autoComplete="off"
        />

        <Textarea
          label="Description (optional)"
          tone="dark"
          resize="none"
          rows={3}
          {...register("description")}
          error={errors.description?.message}
          maxLength={TASK_DESCRIPTION_MAX}
          placeholder="Add any useful details..."
        />
      </section>

      <section
        aria-labelledby="schedule-heading"
        className="form-section overflow-hidden"
      >
        <h2
          id="schedule-heading"
          className="form-section__title"
        >
          Schedule
        </h2>

        <div className="flex min-w-0 flex-col gap-2">
          <Input
            label="Date"
            type="date"
            tone="dark"
            min={editing ? undefined : minDate}
            {...register("date")}
            error={errors.date?.message}
          />
          <AnimatePresence initial={false}>
            {!errors.date && (
              <motion.p
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="type-caption text-on-dark-muted"
              >
                Pick today or a later day.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <Controller
          control={control}
          name="type"
          render={({ field, fieldState }) => (
            <TaskTypeField
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </section>

      <section
        aria-label="Sub tasks"
        className="form-section"
      >
        <SubtaskListField form={form} showDone={editing} />
      </section>
    </>
  );
}
