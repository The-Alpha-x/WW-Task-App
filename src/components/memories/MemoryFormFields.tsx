"use client";

import { type UseFormReturn } from "react-hook-form";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  MEMORY_TITLE_MAX,
  MEMORY_DESCRIPTION_MAX,
  MEMORY_LOCATION_MAX,
  MEMORY_NOTES_MAX,
  getMaxMemoryDate,
  type MemoryFormValues,
} from "@/lib/memories/form";

export interface MemoryFormFieldsProps {
  form: UseFormReturn<MemoryFormValues>;
  /** Disables every field while a save is running. */
  disabled?: boolean;
  /**
   * Latest selectable date. Defaults to today (or yesterday when
   * `MEMORY_ALLOWS_TODAY` is false). Edit forms may raise it to the stored
   * date so the existing value stays selectable.
   */
  maxDate?: string;
}

/**
 * Shared memory form fields in dark glassmorphic cards, matching
 * TaskFormFields and EventFormFields visual language.
 */
export function MemoryFormFields({
  form,
  disabled = false,
  maxDate = getMaxMemoryDate(),
}: MemoryFormFieldsProps) {
  const reduce = useReducedMotion();
  const {
    register,
    formState: { errors },
  } = form;
  const scheduleError = errors.date?.message ?? errors.time?.message;

  return (
    <fieldset
      disabled={disabled}
      className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0 md:gap-6"
    >
      <section
        aria-label="Memory details"
        className="form-section"
      >
        <h2 className="form-section__title">
          Details
        </h2>

        <Input
          label="Memory title"
          tone="dark"
          {...register("title")}
          error={errors.title?.message}
          placeholder="e.g. That sunset at the beach"
          maxLength={MEMORY_TITLE_MAX}
          autoComplete="off"
        />

        <Textarea
          label="Description (optional)"
          tone="dark"
          resize="none"
          rows={3}
          {...register("description")}
          error={errors.description?.message}
          maxLength={MEMORY_DESCRIPTION_MAX}
          placeholder="What made this moment special?"
        />
      </section>

      <section
        aria-labelledby="memory-when-heading"
        className="form-section overflow-hidden"
      >
        <h2
          id="memory-when-heading"
          className="form-section__title"
        >
          When it happened
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            tone="dark"
            max={maxDate}
            {...register("date")}
            error={errors.date?.message}
          />
          <Input
            label="Time (optional)"
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
              className="-mt-1 type-caption text-on-dark-muted"
            >
              Choose a date in the past — the day this memory happened.
            </motion.p>
          )}
        </AnimatePresence>
      </section>

      <section
        aria-label="Memory location"
        className="form-section"
      >
        <h2 className="form-section__title">
          Location
        </h2>

        <Input
          label="Location (optional)"
          tone="dark"
          {...register("location")}
          error={errors.location?.message}
          maxLength={MEMORY_LOCATION_MAX}
          placeholder="e.g. Santorini, Greece"
          autoComplete="off"
        />
      </section>

      <section
        aria-label="Memory notes"
        className="form-section"
      >
        <h2 className="form-section__title">
          Notes
        </h2>

        <Textarea
          label="Notes (optional)"
          tone="dark"
          resize="none"
          rows={3}
          {...register("notes")}
          error={errors.notes?.message}
          maxLength={MEMORY_NOTES_MAX}
          placeholder="People, places, feelings — anything you want to remember..."
        />
      </section>
    </fieldset>
  );
}
