"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TaskTypeField } from "@/components/tasks/TaskTypeField";
import {
  EVENT_DESCRIPTION_MAX,
  EVENT_NOTES_MAX,
  EVENT_TITLE_MAX,
  getMinEventDate,
  type EventFormValues,
} from "@/lib/events/form";

export interface EventFormFieldsProps {
  form: UseFormReturn<EventFormValues>;
  /** Disables every field while a save is running. */
  disabled?: boolean;
  /**
   * Earliest selectable date. Defaults to today; the edit form lowers it to
   * the stored date when that date has already passed, so the existing value
   * stays selectable.
   */
  minDate?: string;
}

/**
 * Shared event form fields in dark glassmorphic cards, matching TaskFormFields
 * so Add/Edit Event and Add/Edit Task share the exact same visual language.
 */
export function EventFormFields({
  form,
  disabled = false,
  minDate = getMinEventDate(),
}: EventFormFieldsProps) {
  const reduce = useReducedMotion();
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const scheduleError = errors.date?.message ?? errors.time?.message;

  return (
    <fieldset
      disabled={disabled}
      className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0 sm:gap-5"
    >
      <section
        aria-label="Event details"
        className="flex flex-col gap-4 rounded-xl bg-glass/80 p-4 ring-1 ring-glass-border/10 backdrop-blur-md sm:gap-5 sm:p-5 md:p-6"
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider text-on-dark-muted/70">
          Details
        </h2>

        <Input
          label="Event title"
          tone="dark"
          {...register("title")}
          error={errors.title?.message}
          placeholder="e.g. Dinner at the harbour"
          maxLength={EVENT_TITLE_MAX}
          autoComplete="off"
        />

        <Textarea
          label="Description (optional)"
          tone="dark"
          resize="none"
          rows={3}
          {...register("description")}
          error={errors.description?.message}
          maxLength={EVENT_DESCRIPTION_MAX}
          placeholder="What is the plan?"
        />
      </section>

      <section
        aria-labelledby="event-schedule-heading"
        className="flex min-w-0 flex-col gap-4 overflow-hidden rounded-xl bg-glass/80 p-4 ring-1 ring-glass-border/10 backdrop-blur-md sm:gap-5 sm:p-5 md:p-6"
      >
        <h2
          id="event-schedule-heading"
          className="text-xs font-semibold uppercase tracking-wider text-on-dark-muted/70"
        >
          Schedule
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            tone="dark"
            min={minDate}
            {...register("date")}
            error={errors.date?.message}
          />
          <Input
            label="Time"
            type="time"
            tone="dark"
            {...register("time")}
            error={errors.time?.message}
          />
        </div>

        <AnimatePresence initial={false}>
          {!scheduleError && (
            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="-mt-1 text-xs font-medium text-on-dark-muted"
            >
              Pick today or a later day. Today needs a time that has not passed.
            </motion.p>
          )}
        </AnimatePresence>

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
        aria-label="Event notes"
        className="flex flex-col gap-4 rounded-xl bg-glass/80 p-4 ring-1 ring-glass-border/10 backdrop-blur-md sm:gap-5 sm:p-5 md:p-6"
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider text-on-dark-muted/70">
          Notes
        </h2>

        <Textarea
          label="Notes (optional)"
          tone="dark"
          resize="none"
          rows={3}
          {...register("notes")}
          error={errors.notes?.message}
          maxLength={EVENT_NOTES_MAX}
          placeholder="Anything to remember: address, booking number, what to bring..."
        />
      </section>
    </fieldset>
  );
}
