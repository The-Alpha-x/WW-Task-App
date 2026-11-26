import type { Task, TaskGroup } from "@/types/task";
import { getLocalDate } from "@/lib/date-time";

/** Group completed tasks separately; schedule open tasks from their due date/time. */
export function getTaskGroup(task: Task): TaskGroup {
  if (task.completed) return "completed";
  if (task.date) {
    return task.date <= getLocalDate() ? "today" : "upcoming";
  }
  return task.time ? "today" : "upcoming";
}

export function countDoneSubtasks(task: Task): number {
  return task.subtasks.filter((subtask) => subtask.done).length;
}
