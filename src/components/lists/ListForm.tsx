"use client";

import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FormActions } from "@/components/ui/FormActions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TaskTypeField } from "@/components/tasks/TaskTypeField";
import {
  createListFormSchema,
  LIST_NOTES_MAX,
  LIST_TITLE_MAX,
  type ListFormValues,
} from "@/lib/lists/form";
import { ListItemsField } from "./ListItemsField";

export interface ListFormProps {
  /** Starting values: empty for a new list, the stored list when editing. */
  initialValues: ListFormValues;
  saving?: boolean;
  /** Save failure from the service, shown above the form. */
  error?: string;
  submitLabel: string;
  savingLabel: string;
  /** Called with validated, trimmed values. Persisting is the caller's job. */
  onSubmit: (values: ListFormValues) => void;
  /** Optional cancel handler (used in edit mode). */
  onCancel?: () => void;
}

/**
 * List form shared by Add and Edit, in the same `.form-section` cards as the
 * task, event and memory forms: Details (title, type), Items, Notes.
 */
export function ListForm({
  initialValues,
  saving = false,
  error,
  submitLabel,
  savingLabel,
  onSubmit,
  onCancel,
}: ListFormProps) {
  const reduce = useReducedMotion();
  const form = useForm<ListFormValues>({
    resolver: zodResolver(createListFormSchema()) as never,
    defaultValues: initialValues,
  });
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!error) return;
    noticeRef.current?.scrollIntoView({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [error, reduce]);

  const handleSubmit = form.handleSubmit((values: ListFormValues) => {
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

      <fieldset
        disabled={saving}
        className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0 md:gap-6"
      >
        <section aria-label="List details" className="form-section">
          <h2 className="form-section__title">Details</h2>

          <Input
            label="List title"
            tone="dark"
            {...register("title")}
            error={errors.title?.message}
            placeholder="e.g. Weekly groceries"
            maxLength={LIST_TITLE_MAX}
            autoComplete="off"
          />

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

        <section aria-label="List items" className="form-section">
          <ListItemsField form={form} />
        </section>

        <section aria-label="List notes" className="form-section">
          <h2 className="form-section__title">Notes</h2>

          <Textarea
            label="Notes (optional)"
            tone="dark"
            resize="none"
            rows={3}
            {...register("notes")}
            error={errors.notes?.message}
            maxLength={LIST_NOTES_MAX}
            placeholder="Brands, reminders, anything worth remembering..."
          />
        </section>
      </fieldset>

      <FormActions
        saving={saving}
        submitLabel={submitLabel}
        savingLabel={savingLabel}
        onCancel={onCancel}
      />
    </form>
  );
}
