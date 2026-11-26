import { z } from "zod";
import type { Subtask, Task, TaskType } from "@/types/task";
import { getLocalDate, isValidDateString } from "@/lib/date-time";

/**
 * Zod schema and form helpers for creating and editing tasks. No React and no
 * Firebase, so the same rules serve the add/edit forms (via zodResolver) and
 * the service-level guard.
 */

export const TASK_TITLE_MAX = 100;
export const TASK_DESCRIPTION_MAX = 1000;
export const SUBTASK_TITLE_MAX = 100;
export const SUBTASKS_MAX = 20;

export const TASK_TYPES: readonly { value: TaskType; label: string; hint: string }[] = [
  { value: "individual", label: "Individual", hint: "Just for you" },
  { value: "shared", label: "Shared", hint: "For both of you" },
];

export interface TaskFormValues {
  title: string;
  description: string;
  /** `YYYY-MM-DD`, or "" while unset. There is deliberately no time field. */
  date: string;
  type: TaskType;
  subtasks: Subtask[];
}

export type TaskFormSubmission = TaskFormValues;

export interface TaskFormContext {
  /** Local `YYYY-MM-DD`; defaults to today. Injectable for tests. */
  today?: string;
  /**
   * Edit mode: the date already stored on the task. Keeping it unchanged is
   * allowed even when it is no longer in the future, so a task due today can
   * still be renamed. Any other date must be in the future.
   */
  originalDate?: string | null;
}

const subtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
});

export function createTaskFormSchema(context: TaskFormContext = {}) {
  const today = context.today ?? getLocalDate();
  return z
    .object({
      title: z
        .string()
        .trim()
        .min(1, "Please enter a task title.")
        .max(TASK_TITLE_MAX, `Keep the title to ${TASK_TITLE_MAX} characters or fewer.`),
      description: z
        .string()
        .trim()
        .max(
          TASK_DESCRIPTION_MAX,
          `Keep the description to ${TASK_DESCRIPTION_MAX} characters or fewer.`,
        ),
      date: z
        .string()
        .min(1, "Please choose a date.")
        .refine(isValidDateString, "Enter a valid date.")
        .refine(
          (date) => date === context.originalDate || date >= getMinTaskDate(today),
          "Choose today or a later date.",
        ),
      type: z.enum(["individual", "shared"], {
        message: "Choose shared or individual.",
      }),
      subtasks: z.array(subtaskSchema),
    })
    .superRefine((data, ctx) => {
      const seen = new Set<string>();
      let filledCount = 0;
      data.subtasks.forEach((subtask, index) => {
        const title = subtask.title.trim();
        if (!title) return;
        filledCount += 1;
        const key = title.toLowerCase();
        if (title.length > SUBTASK_TITLE_MAX) {
          ctx.addIssue({
            code: "custom",
            path: ["subtasks", index, "title"],
            message: `Keep subtasks to ${SUBTASK_TITLE_MAX} characters or fewer.`,
          });
        } else if (seen.has(key)) {
          ctx.addIssue({
            code: "custom",
            path: ["subtasks", index, "title"],
            message: "This subtask is already on the list.",
          });
        }
        seen.add(key);
      });
      if (filledCount > SUBTASKS_MAX) {
        ctx.addIssue({
          code: "custom",
          path: ["subtasks"],
          message: `Add up to ${SUBTASKS_MAX} subtasks.`,
        });
      }
    })
    .transform((data) => ({
      ...data,
      subtasks: data.subtasks
        .map((subtask) => ({ ...subtask, title: subtask.title.trim() }))
        .filter((subtask) => subtask.title.length > 0),
    }));
}

/** Earliest date a task may be created for: today. */
export function getMinTaskDate(today = getLocalDate()): string {
  return today;
}

export function createEmptyTaskForm(firstSubtaskId: string): TaskFormValues {
  return {
    title: "",
    description: "",
    date: getLocalDate(),
    type: "individual",
    subtasks: [{ id: firstSubtaskId, title: "", done: false }],
  };
}

export function taskToFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    date: task.date ?? "",
    type: task.type,
    subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
  };
}
