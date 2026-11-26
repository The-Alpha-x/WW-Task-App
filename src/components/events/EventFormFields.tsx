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
 * Every field of the event form, in the same sheet layout as the task form:
 * title on the dark page, a lime description sheet, a light schedule sheet
 * and a light notes sheet. Used by both Add and Edit so they cannot drift.
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
    <fieldset disabled={disabled} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
      <section>
        <Input
          label="Event title"
          {...register("title")}
          error={errors.title?.message}
          placeholder="e.g. Dinner at the harbour"
          maxLength={EVENT_TITLE_MAX}
          autoComplete="off"
        />
      </section>

      <section
        aria-label="Event description"
        className="rounded-2xl bg-lime p-5 text-ink md:p-6"
      >
        <Textarea
          label="Description (optional)"
          tone="light"
          resize="none"
          rows={4}
          {...register("description")}
          error={errors.description?.message}
          maxLength={EVENT_DESCRIPTION_MAX}
          placeholder="What is the plan?"
        />
      </section>

      <section
        aria-labelledby="event-schedule-heading"
        className="flex flex-col gap-5 rounded-2xl bg-card p-5 text-ink md:p-6"
      >
        <h2 id="event-schedule-heading" className="text-xl font-bold">
          Schedule
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            tone="light"
            min={minDate}
            {...register("date")}
            error={errors.date?.message}
          />
          <Input
            label="Time"
            type="time"
            tone="light"
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
              className="-mt-2 text-sm font-medium text-ink-muted"
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

      <section aria-label="Event notes" className="rounded-2xl bg-card p-5 text-ink md:p-6">
        <Textarea
          label="Notes (optional)"
          tone="light"
          resize="none"
          rows={4}
          {...register("notes")}
          error={errors.notes?.message}
          maxLength={EVENT_NOTES_MAX}
          placeholder="Anything to remember: address, booking number, what to bring..."
        />
      </section>
    </fieldset>
  );
}
