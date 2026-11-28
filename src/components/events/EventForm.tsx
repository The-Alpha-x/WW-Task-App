"use client";

import { useEffect, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FormActions } from "@/components/ui/FormActions";
import {
  createEventFormSchema,
  type EventFormSubmission,
  type EventFormValues,
} from "@/lib/events/form";
import { EventFormFields } from "./EventFormFields";

export interface EventFormProps {
  /** Starting values: empty for a new event, the stored event when editing. */
  initialValues: EventFormValues;
  /** Edit mode: the stored schedule, so saving it unchanged is always allowed. */
  original?: { date: string; time: string } | null;
  /** Earliest selectable date; see `EventFormFields`. */
  minDate?: string;
  saving?: boolean;
  /** Save failure from the service, shown above the form. */
  error?: string;
  submitLabel: string;
  savingLabel: string;
  /** Called with validated, trimmed values. Persisting is the caller's job. */
  onSubmit: (values: EventFormSubmission) => void;
  /** Optional cancel handler (used in edit mode). */
  onCancel?: () => void;
}

/**
 * The event form shared by Add and Edit, matching AddTask's dark glassmorphic
 * form layout, alert styling, and full-width lime submit button.
 */
export function EventForm({
  initialValues,
  original = null,
  minDate,
  saving = false,
  error,
  submitLabel,
  savingLabel,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const reduce = useReducedMotion();
  const form = useForm<EventFormValues>({
    // The schema's `location` uses `.default("")`, so zod infers it as optional
    // on input but required on output. The form always supplies a string (see
    // `initialValues`), so the resolver is typed against `EventFormValues`.
    resolver: zodResolver(
      createEventFormSchema({ original }),
    ) as unknown as Resolver<EventFormValues>,
    defaultValues: initialValues,
  });
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!error) return;
    noticeRef.current?.scrollIntoView({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [error, reduce]);

  const handleSubmit = form.handleSubmit((values) => {
    if (!saving) onSubmit(values);
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-5 md:gap-6 lg:max-w-none"
    >
      <div ref={noticeRef} className="flex scroll-mt-6 flex-col empty:hidden">
        <AnimatePresence initial={false}>
          {error && (
            <motion.p
              role="alert"
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="form-alert"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <EventFormFields form={form} disabled={saving} minDate={minDate} />

      <FormActions
        saving={saving}
        submitLabel={submitLabel}
        savingLabel={savingLabel}
        onCancel={onCancel}
      />
    </form>
  );
}
