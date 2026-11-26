"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TASK_TYPES } from "@/lib/tasks/form";
import { cn } from "@/lib/cn";
import type { TaskType } from "@/types/task";

export interface TaskTypeFieldProps {
  value: TaskType;
  onChange: (value: TaskType) => void;
  error?: string;
}

/**
 * Shared / Individual choice rendered as an Apple-style dark segmented control.
 * Native radio inputs preserve keyboard navigation and screen-reader semantics.
 */
export function TaskTypeField({ value, onChange, error }: TaskTypeFieldProps) {
  const groupId = useId();
  const reduce = useReducedMotion();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-on-dark">Type</legend>
      <div className="flex rounded-md bg-background/70 p-1 ring-1 ring-glass-border/10">
        {TASK_TYPES.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className="relative flex-1 cursor-pointer rounded-sm"
            >
              <input
                type="radio"
                name={`task-type-${groupId}`}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              {selected && (
                <motion.span
                  layoutId={`task-type-pill-${groupId}`}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-sm bg-surface-raised ring-1 ring-glass-border/15"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 500, damping: 40 }
                  }
                />
              )}
              <span className="absolute inset-0 rounded-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lime" />
              <span
                className={cn(
                  "relative flex min-h-12 flex-col items-center justify-center px-4 py-2 text-center transition-colors duration-fast ease-standard",
                  selected ? "text-on-dark" : "text-on-dark-muted hover:text-on-dark",
                )}
              >
                <span className="text-sm font-semibold">{option.label}</span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    selected ? "text-lime" : "text-on-dark-muted/70",
                  )}
                >
                  {option.hint}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
