/** A user ID (or "shared") once the task is completed, otherwise null. */
type TaskDoneBy = string | null;

/** Who a task is for. Legacy tasks without a stored type are read as `individual`. */
export type TaskType = "shared" | "individual";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

/** Every task record uses this shape across the dashboard and Tasks page. */
export interface Task {
  id: string;
  title: string;
  description: string;
  /** Due date in YYYY-MM-DD format, or null when unset. */
  date: string | null;
  /**
   * Legacy only. New and edited tasks never have a due time (always null and
   * not written to Firestore); old documents that still have one keep working.
   */
  time: string | null;
  completed: boolean;
  subtasks: readonly Subtask[];
  doneBy: TaskDoneBy;
  /** Local date/time of the most recent task update. */
  updatedDate: string;
  updatedTime: string;
  /** Shared or individual. */
  type: TaskType;
  /** Creation timestamp in ISO-8601 UTC format. */
  createdAt: string;
  /** ID of the user who created the task. */
  createdBy: string;
  /** Timestamp of the most recent update in ISO-8601 UTC format. */
  updatedAt: string;
  /** ID of the user who made the most recent update. */
  updatedBy: string;
}

/** Section of the Tasks page. */
export type TaskGroup = "today" | "upcoming" | "completed";
