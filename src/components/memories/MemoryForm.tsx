"use client";
import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TaskTypeField } from "@/components/tasks/TaskTypeField";
import {
  createMemoryFormSchema,
  getMaxMemoryDate,
  MEMORY_TITLE_MAX,
  MEMORY_DESCRIPTION_MAX,
  MEMORY_NOTES_MAX,
  type MemoryFormValues,
  type MemoryFormSubmission,
} from "@/lib/memories/form";

export function MemoryForm({
  initialValues,
  original = null,
  saving = false,
  error,
  submitLabel = "Save Memory",
  onSubmit,
  onCancel,
}: {
  initialValues: MemoryFormValues;
  original?: { date: string; time: string | null } | null;
  saving?: boolean;
  error?: string;
  submitLabel?: string;
  onSubmit: (values: MemoryFormSubmission) => void;
  onCancel: () => void;
}) {
  const form = useForm<MemoryFormValues, unknown, MemoryFormSubmission>({
    resolver: zodResolver(createMemoryFormSchema({ original })),
    defaultValues: initialValues,
  });
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const noticeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error)
      noticeRef.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
  }, [error]);
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => !saving && onSubmit(values))}
      className="flex flex-col gap-5"
    >
      <div
        ref={noticeRef}
        role={error ? "alert" : undefined}
        className="empty:hidden rounded-xl bg-danger/10 p-3 text-sm text-danger"
      >
        {error}
      </div>
      <Input
        label="Memory title"
        placeholder="e.g. Our first beach trip"
        autoComplete="off"
        maxLength={MEMORY_TITLE_MAX}
        {...register("title")}
        error={errors.title?.message}
      />
      <section className="rounded-2xl bg-lime p-5 text-ink md:p-6">
        <Textarea
          label="Description (optional)"
          tone="light"
          rows={4}
          resize="none"
          placeholder="What happened? What made it special?"
          maxLength={MEMORY_DESCRIPTION_MAX}
          {...register("description")}
          error={errors.description?.message}
        />
      </section>
      <section className="flex flex-col gap-5 rounded-2xl bg-card p-5 text-ink md:p-6">
        <h2 className="text-xl font-bold">When did it happen?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            tone="light"
            max={getMaxMemoryDate()}
            {...register("date")}
            error={errors.date?.message}
          />
          <Input
            label="Time (optional)"
            type="time"
            tone="light"
            {...register("time")}
            error={errors.time?.message}
          />
        </div>
        <p className="text-sm text-ink-muted">
          Choose today or an earlier date. Time is optional; if you add one for
          today, it must already have passed.
        </p>
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
      <section className="rounded-2xl bg-card p-5 text-ink md:p-6">
        <Textarea
          label="Notes (optional)"
          tone="light"
          rows={4}
          resize="none"
          placeholder="Little details you don't want to forget..."
          maxLength={MEMORY_NOTES_MAX}
          {...register("notes")}
          error={errors.notes?.message}
        />
      </section>
      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" size="lg" loading={saving}>
          {saving ? "Saving memory..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
