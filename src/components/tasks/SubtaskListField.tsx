"use client";

import { useState } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { generateId } from "@/lib/id";
import {
  SUBTASKS_MAX,
  SUBTASK_TITLE_MAX,
  type TaskFormValues,
} from "@/lib/tasks/form";
import { cn } from "@/lib/cn";

export interface SubtaskListFieldProps {
  form: UseFormReturn<TaskFormValues>;
  /** Edit mode: shows a checkbox per row so progress stays visible and editable. */
  showDone?: boolean;
}

/**
 * Dynamic checklist editor used by both task forms via React Hook Form's
 * `useFieldArray`. Rows ease in and out (height + opacity, ~0.2s); motion is
 * off with reduced-motion.
 */
export function SubtaskListField({ form, showDone = false }: SubtaskListFieldProps) {
  const reduce = useReducedMotion();
  const duration = reduce ? 0 : 0.2;
  const {
    control,
    register,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "subtasks",
    keyName: "fieldKey",
  });
  const watchedSubtasks = useWatch({ control, name: "subtasks" }) ?? [];
  const [focusSubtaskId, setFocusSubtaskId] = useState<string | null>(null);

  const filled = watchedSubtasks.filter((subtask) => subtask?.title?.trim()).length;
  const atLimit = fields.length >= SUBTASKS_MAX;
  const listError = errors.subtasks?.message ?? errors.subtasks?.root?.message;

  const handleAdd = () => {
    if (atLimit) return;
    const id = generateId("subtask");
    append({ id, title: "", done: false });
    setFocusSubtaskId(id);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="form-section__title">Sub Tasks</h2>
        <p
          className="rounded-full bg-input px-3 py-1 type-caption font-semibold text-on-dark-muted ring-1 ring-field"
          aria-live="polite"
        >
          {filled} added
        </p>
      </div>

      {fields.length === 0 && (
        <p className="type-body mb-4 text-on-dark-muted">
          No subtasks yet. Subtasks are optional.
        </p>
      )}

      <ul className="flex flex-col">
        <AnimatePresence initial={false}>
          {fields.map((subtask, index) => {
            const error = errors.subtasks?.[index]?.title?.message;
            const inputId = `subtask-${subtask.id}`;
            return (
              <motion.li
                key={subtask.fieldKey}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration, ease: [0.2, 0, 0, 1] }}
                className="overflow-hidden"
              >
                {/* padding lives inside so the height animation has no margin jump */}
                <div className="pb-3">
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-md border bg-input px-4 py-1 transition-[border-color,box-shadow] duration-fast",
                      error
                        ? "border-danger ring-1 ring-inset ring-danger"
                        : "border-field hover:border-on-dark-muted/60 focus-within:border-ring focus-within:ring-1 focus-within:ring-inset focus-within:ring-ring",
                    )}
                  >
                    {showDone ? (
                      <input
                        type="checkbox"
                        {...register(`subtasks.${index}.done`)}
                        aria-label={`Mark subtask ${index + 1} done`}
                        className="h-5 w-5 shrink-0 cursor-pointer accent-lime"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 rounded-full border-2 border-on-dark-muted/60"
                      />
                    )}
                    <label className="sr-only" htmlFor={inputId}>
                      Subtask {index + 1}
                    </label>
                    <input
                      id={inputId}
                      {...register(`subtasks.${index}.title`)}
                      onKeyDown={(event) => {
                        // Enter adds the next row instead of submitting the form.
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        if (watchedSubtasks[index]?.title?.trim() && !atLimit) {
                          handleAdd();
                        }
                      }}
                      autoFocus={subtask.id === focusSubtaskId}
                      maxLength={SUBTASK_TITLE_MAX}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${inputId}-error` : undefined}
                      placeholder="Add a subtask"
                      className="h-12 min-w-0 flex-1 bg-transparent text-base font-medium text-on-dark outline-none placeholder:text-subtle-text"
                    />
                    <button
                      type="button"
                      aria-label={`Remove subtask ${index + 1}`}
                      onClick={() => remove(index)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-dark-muted transition-colors duration-fast hover:bg-danger/15 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </div>
                  {error && (
                    <p
                      id={`${inputId}-error`}
                      role="alert"
                      className="mt-2 px-1 text-sm font-semibold text-danger"
                    >
                      {error}
                    </p>
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {listError && (
        <p role="alert" className="mb-2 text-sm font-semibold text-danger">
          {listError}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="md"
        leftIcon={<Plus aria-hidden="true" size={18} />}
        onClick={handleAdd}
        disabled={atLimit}
        className="mt-2 w-full"
      >
        {atLimit ? `Limit of ${SUBTASKS_MAX} reached` : "Add subtask"}
      </Button>
    </div>
  );
}
