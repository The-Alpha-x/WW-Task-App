import type { TaskType } from "@/types/task";

/** Who an event is for. Same two values as tasks, so the type is shared. */
export type EventType = TaskType;

/**
 * Every event record uses this shape.
 *
 * Calendar fields follow the task conventions: `date` is a local
 * `YYYY-MM-DD` string and `time` a local `HH:mm` (24h) string. They say WHEN
 * THE EVENT HAPPENS and are never derived from, or used as, the audit
 * timestamps below.
 */
export interface Event {
  id: string;
  title: string;
  /** Optional; `""` when not given. */
  description: string;
  /** Day the event takes place, local `YYYY-MM-DD`. */
  date: string;
  /** Start time, local `HH:mm` (24h). Required. */
  time: string;
  /** Shared or individual. */
  type: EventType;
  /** Optional; `""` when not given. */
  notes: string;
  /** When the document was created: ISO-8601 UTC instant. */
  createdAt: string;
  /** ID of the user who created the event. */
  createdBy: string;
  /** When the document was last changed: ISO-8601 UTC instant. */
  updatedAt: string;
  /** ID of the user who made the most recent change. */
  updatedBy: string;
}
