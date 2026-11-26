import { z } from "zod";
import type { Memory, MemoryType } from "@/types/memory";
import {
  addDaysToDate,
  getLocalDate,
  getLocalTime,
  isValidDateString,
  isValidTimeString,
} from "@/lib/date-time";

/**
 * Zod schema and form helpers for creating and editing memories. No React and
 * no Firebase, so one set of rules serves the forms and the service-level guard.
 */

export const MEMORY_TITLE_MAX = 100;
export const MEMORY_DESCRIPTION_MAX = 1000;
export const MEMORY_NOTES_MAX = 2000;

export const MEMORY_TYPE_VALUES: readonly MemoryType[] = ["individual", "shared"];

/**
 * Whether a memory may be dated today. `true`: it may (a memory from this
 * morning is real), as long as a given time is not later than now. `false`:
 * the date must be yesterday or earlier. This is the only place to change it.
 */
export const MEMORY_ALLOWS_TODAY = true;

export interface MemoryFormValues {
  title: string;
  description: string;
  /** `YYYY-MM-DD`, or "" while unset. */
  date: string;
  /** `HH:mm` (24h), or "" when the memory has no time. */
  time: string;
  type: MemoryType;
  notes: string;
}

export interface MemoryFormSubmission {
  title: string;
  description: string;
  date: string;
  /** `null` when the form time was blank. */
  time: string | null;
  type: MemoryType;
  notes: string;
}

export interface MemoryFormContext {
  /** The current moment; defaults to `new Date()`. Injectable for tests. */
  now?: Date;
  /**
   * Edit mode: the date and time already stored on the memory. Saving them
   * unchanged is always allowed. Any other date/time must be in the past.
   */
  original?: { date: string; time: string | null } | null;
}

export function isMemoryType(value: unknown): value is MemoryType {
  return value === "shared" || value === "individual";
}

export function createMemoryFormSchema(context: MemoryFormContext = {}) {
  const now = context.now ?? new Date();
  return z
    .object({
      title: z
        .string()
        .trim()
        .min(1, "Please enter a memory title.")
        .max(
          MEMORY_TITLE_MAX,
          `Keep the title to ${MEMORY_TITLE_MAX} characters or fewer.`,
        ),
      description: z
        .string()
        .trim()
        .max(
          MEMORY_DESCRIPTION_MAX,
          `Keep the description to ${MEMORY_DESCRIPTION_MAX} characters or fewer.`,
        ),
      date: z
        .string()
        .trim()
        .min(1, "Please choose the date it happened.")
        .refine(isValidDateString, "Enter a valid date."),
      time: z
        .string()
        .trim()
        .refine((val) => !val || isValidTimeString(val), "Enter a valid time."),
      type: z.enum(["individual", "shared"], {
        message: "Choose shared or individual.",
      }),
      notes: z
        .string()
        .trim()
        .max(
          MEMORY_NOTES_MAX,
          `Keep the notes to ${MEMORY_NOTES_MAX} characters or fewer.`,
        ),
    })
    .superRefine((data, ctx) => {
      const original = context.original;
      const scheduleChanged =
        !original ||
        data.date !== original.date ||
        (data.time || null) !== original.time;
      if (!scheduleChanged) return;
      const today = getLocalDate(now);
      if (data.date > getMaxMemoryDate(now)) {
        ctx.addIssue({
          code: "custom",
          path: ["date"],
          message: MEMORY_ALLOWS_TODAY
            ? "Choose today or an earlier date."
            : "Choose a date before today.",
        });
      } else if (
        MEMORY_ALLOWS_TODAY &&
        data.date === today &&
        data.time &&
        data.time > getLocalTime(now)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["time"],
          message: "Choose a time that has already passed today.",
        });
      }
    })
    .transform((data): MemoryFormSubmission => ({
      ...data,
      time: data.time || null,
    }));
}

/** Latest date a memory may have (for the date input's `max`). */
export function getMaxMemoryDate(now = new Date()): string {
  const today = getLocalDate(now);
  return MEMORY_ALLOWS_TODAY ? today : addDaysToDate(today, -1);
}

export function createEmptyMemoryForm(): MemoryFormValues {
  return { title: "", description: "", date: getLocalDate(), time: "", type: "individual", notes: "" };
}

export function memoryToFormValues(memory: Memory): MemoryFormValues {
  return {
    title: memory.title,
    description: memory.description,
    date: memory.date,
    time: memory.time ?? "",
    type: memory.type,
    notes: memory.notes,
  };
}
