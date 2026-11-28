import { z } from "zod";
import type { Event, EventType } from "@/types/event";
import {
  getLocalDate,
  getLocalTime,
  isValidDateString,
  isValidTimeString,
} from "@/lib/date-time";

/**
 * Zod schema and form helpers for creating and editing events. No React and no
 * Firebase, so one set of rules serves the add/edit forms (via zodResolver) and
 * the service-level guard.
 */

export const EVENT_TITLE_MAX = 100;
export const EVENT_DESCRIPTION_MAX = 1000;
export const EVENT_NOTES_MAX = 2000;
export const EVENT_LOCATION_MAX = 200;

export const EVENT_TYPE_VALUES: readonly EventType[] = ["individual", "shared"];

export interface EventFormValues {
  title: string;
  description: string;
  /** `YYYY-MM-DD`, or "" while unset. */
  date: string;
  /** `HH:mm` (24h), or "" while unset. */
  time: string;
  type: EventType;
  notes: string;
  /** Optional place where the event happens. */
  location: string;
}

export type EventFormSubmission = EventFormValues;

export interface EventFormContext {
  /** The current moment; defaults to `new Date()`. Injectable for tests. */
  now?: Date;
  /**
   * Edit mode: the schedule already stored on the event. Saving it unchanged
   * is always allowed, so an event that is today or in the past can still be
   * renamed. Any other date/time must be in the future.
   */
  original?: { date: string; time: string } | null;
}

export function isEventType(value: unknown): value is EventType {
  return value === "shared" || value === "individual";
}

export function createEventFormSchema(context: EventFormContext = {}) {
  const now = context.now ?? new Date();
  return z
    .object({
      title: z
        .string()
        .trim()
        .min(1, "Please enter an event title.")
        .max(EVENT_TITLE_MAX, `Keep the title to ${EVENT_TITLE_MAX} characters or fewer.`),
      description: z
        .string()
        .trim()
        .max(
          EVENT_DESCRIPTION_MAX,
          `Keep the description to ${EVENT_DESCRIPTION_MAX} characters or fewer.`,
        ),
      date: z
        .string()
        .trim()
        .min(1, "Please choose a date.")
        .refine(isValidDateString, "Enter a valid date."),
      time: z
        .string()
        .trim()
        .min(1, "Please choose a time.")
        .refine(isValidTimeString, "Enter a valid time."),
      type: z.enum(["individual", "shared"], {
        message: "Choose shared or individual.",
      }),
      notes: z
        .string()
        .trim()
        .max(EVENT_NOTES_MAX, `Keep the notes to ${EVENT_NOTES_MAX} characters or fewer.`),
      location: z
        .string()
        .trim()
        .max(EVENT_LOCATION_MAX, `Keep the location to ${EVENT_LOCATION_MAX} characters or fewer.`)
        .default(""),
    })
    .superRefine((data, ctx) => {
      const original = context.original;
      const scheduleChanged =
        !original || data.date !== original.date || data.time !== original.time;
      if (!scheduleChanged) return;
      const today = getLocalDate(now);
      if (data.date < today) {
        ctx.addIssue({
          code: "custom",
          path: ["date"],
          message: "Choose today or a later date.",
        });
      } else if (data.date === today && data.time <= getLocalTime(now)) {
        ctx.addIssue({
          code: "custom",
          path: ["time"],
          message: "Choose a time later today, or pick a later date.",
        });
      }
    });
}

/** Earliest date an event may be created for: today (a time check covers "later today"). */
export function getMinEventDate(now = new Date()): string {
  return getLocalDate(now);
}

export function createEmptyEventForm(): EventFormValues {
  return { title: "", description: "", date: getLocalDate(), time: "", type: "individual", notes: "", location: "" };
}

export function eventToFormValues(event: Event): EventFormValues {
  return {
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    type: event.type,
    notes: event.notes,
    location: event.location,
  };
}
