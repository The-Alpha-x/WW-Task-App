import type { TaskType } from "@/types/task";

/** Who a memory is for. Same two values as tasks and events, so the type is shared. */
export type MemoryType = TaskType;

/**
 * Every memory record uses this shape.
 *
 * `date` (and the optional `time`) say WHEN THE MEMORY HAPPENED: a local
 * `YYYY-MM-DD` string and a local `HH:mm` (24h) string, always in the past.
 * `createdAt`/`updatedAt` say WHEN THE DOCUMENT WAS SAVED: ISO-8601 UTC
 * instants. A memory from 2019 saved today has `date: "2019-..."` and
 * `createdAt: "<today>"`. The two groups are never derived from each other.
 */
export interface Memory {
  id: string;
  title: string;
  /** Optional; `""` when not given. */
  description: string;
  /** Day the memory happened, local `YYYY-MM-DD`. Required, never in the future. */
  date: string;
  /** Time of day it happened, local `HH:mm` (24h). `null` when not given. */
  time: string | null;
  /** Shared or individual. */
  type: MemoryType;
  /** Optional; `""` when not given. */
  notes: string;
  /** When the document was created: ISO-8601 UTC instant. */
  createdAt: string;
  /** ID of the user who created the memory. */
  createdBy: string;
  /** When the document was last changed: ISO-8601 UTC instant. */
  updatedAt: string;
  /** ID of the user who made the most recent change. */
  updatedBy: string;
}
