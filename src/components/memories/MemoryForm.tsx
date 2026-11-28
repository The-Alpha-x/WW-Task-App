"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FormActions } from "@/components/ui/FormActions";
import {
  createMemoryFormSchema,
  type MemoryFormValues,
} from "@/lib/memories/form";
import { MemoryFormFields } from "./MemoryFormFields";

export interface MemoryFormProps {
  /** Starting values: empty for a new memory, the stored memory when editing. */
  initialValues: MemoryFormValues;
  /** Edit mode: the stored schedule, so saving it unchanged is always allowed. */
  original?: { date: string; time: string | null } | null;
  /** Latest selectable date; see `MemoryFormFields`. */
  maxDate?: string;
  saving?: boolean;
  /** Save failure from the service, shown above the form. */
  error?: string;
  submitLabel: string;
  savingLabel: string;
  /** Called with validated, trimmed values. Persisting is the caller's job. */
  onSubmit: (values: MemoryFormValues) => void;
  /** Optional cancel handler (used in edit mode). */
  onCancel?: () => void;
}

/**
 * Memory form shared by Add and Edit, matching the event and task form
 * layout: `.form-section` cards, `.form-alert` styling and the shared `FormActions` row.
 */
export function MemoryForm({
  initialValues,
  original = null,
  maxDate,
  saving = false,
  error,
  submitLabel,
  savingLabel,
  onSubmit,
  onCancel,
}: MemoryFormProps) {
  const reduce = useReducedMotion();
  const form = useForm<MemoryFormValues>({
    resolver: zodResolver(createMemoryFormSchema({ original })) as never,
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

  const handleSubmit = form.handleSubmit((values: MemoryFormValues) => {
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

      <MemoryFormFields form={form} disabled={saving} maxDate={maxDate} />

      <FormActions
        saving={saving}
        submitLabel={submitLabel}
        savingLabel={savingLabel}
        onCancel={onCancel}
      />
    </form>
  );
}
