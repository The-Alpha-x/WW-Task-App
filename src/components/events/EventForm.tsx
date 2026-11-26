"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  createEventFormSchema,
  type EventFormSubmission,
  type EventFormValues,
} from "@/lib/events/form";
import { EventFormFields } from "./EventFormFields";
import { EventNotice } from "./EventNotice";

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
  onCancel: () => void;
}

/**
 * The event form shared by Add and Edit: fields, a failure message, and the
 * Cancel / Save actions. Validation uses `createEventFormSchema` via
 * React Hook Form; the service validates again before it writes.
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
    resolver: zodResolver(createEventFormSchema({ original })),
    defaultValues: initialValues,
  });
  const noticeRef = useRef<HTMLDivElement>(null);

  // A save failure appears above the form, but the person is at the bottom
  // (on the Save button), so bring the message into view.
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
      className="flex flex-col gap-5"
    >
      <div ref={noticeRef} className="flex scroll-mt-6 flex-col empty:hidden">
        <AnimatePresence initial={false}>
          {error && <EventNotice variant="error">{error}</EventNotice>}
        </AnimatePresence>
      </div>

      <EventFormFields form={form} disabled={saving} minDate={minDate} />

      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="md:min-w-40"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          className="md:min-w-56"
          loading={saving}
        >
          {saving ? savingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
