"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
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
 * layout: dark glassmorphic cards, alert styling, full-width lime submit.
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
      className="mx-auto flex w-full max-w-2xl flex-col gap-4 sm:gap-5 lg:max-w-none"
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
              className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/25"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <MemoryFormFields form={form} disabled={saving} maxDate={maxDate} />

      {onCancel ? (
        <div className="flex flex-col-reverse gap-3 pt-1 md:flex-row md:justify-end">
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
            className="shadow-lime-pill md:min-w-56"
            loading={saving}
          >
            {saving ? savingLabel : submitLabel}
          </Button>
        </div>
      ) : (
        <div className="pt-1">
          <Button
            type="submit"
            size="lg"
            className="w-full shadow-lime-pill"
            loading={saving}
          >
            {saving ? savingLabel : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
