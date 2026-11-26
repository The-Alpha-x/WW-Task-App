import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { requireFirestore, watchCollection } from "@/lib/firebase";
import { generateId } from "@/lib/id";
import { getLocalDate, getLocalTime } from "@/lib/date-time";
import { getTaskGroup } from "@/lib/tasks/display";
import { createTaskFormSchema, type TaskFormSubmission } from "@/lib/tasks/form";
import type { Task, TaskGroup, TaskType } from "@/types/task";

/**
 * Single home for every task-related Firestore operation.
 * Path: users/{uid}/tasks/{taskId}. Components and hooks must not import
 * firebase/firestore for tasks; they call this module instead.
 */

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTask(id: string, value: DocumentData): Task {
  if (
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    (value.date !== null && typeof value.date !== "string") ||
    (value.time != null && typeof value.time !== "string") ||
    (value.type != null && value.type !== "shared" && value.type !== "individual") ||
    (value.updatedAt != null && typeof value.updatedAt !== "string") ||
    (value.updatedBy != null && typeof value.updatedBy !== "string") ||
    typeof value.completed !== "boolean" ||
    !Array.isArray(value.subtasks) ||
    (value.doneBy !== null &&
      value.doneBy !== "shared" &&
      typeof value.doneBy !== "string") ||
    typeof value.updatedDate !== "string" ||
    typeof value.updatedTime !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.createdBy !== "string"
  ) {
    throw new Error(`Task "${id}" has invalid Firestore data.`);
  }

  const subtasks = value.subtasks.map((subtask: unknown) => {
    if (
      !isRecord(subtask) ||
      typeof subtask.id !== "string" ||
      typeof subtask.title !== "string" ||
      typeof subtask.done !== "boolean"
    ) {
      throw new Error(`Task "${id}" has invalid subtask data.`);
    }
    return { id: subtask.id, title: subtask.title, done: subtask.done };
  });

  return {
    id,
    title: value.title,
    description: value.description,
    date: value.date,
    // Tasks saved before this change may lack these fields; read them with
    // safe defaults instead of failing, and the next save writes them.
    time: value.time ?? null,
    completed: value.completed,
    subtasks,
    doneBy: value.doneBy,
    updatedDate: value.updatedDate,
    updatedTime: value.updatedTime,
    type: (value.type ?? "individual") as TaskType,
    createdAt: value.createdAt,
    createdBy: value.createdBy,
    updatedAt: value.updatedAt ?? value.createdAt,
    updatedBy: value.updatedBy ?? value.createdBy,
  };
}

type TaskUpdates = Partial<Omit<Task, "id">>;

/* ------------------------------------------------------------------ */
/* References                                                          */
/* ------------------------------------------------------------------ */

function tasksCollection(userId: string) {
  return collection(requireFirestore(), "users", userId, "tasks");
}

function taskDocument(userId: string, taskId: string) {
  return doc(tasksCollection(userId), taskId);
}

/**
 * Resolves all other user IDs to mirror shared tasks to.
 * Reads registered user docs from `users` and also includes any
 * comma-separated IDs configured in `NEXT_PUBLIC_PARTNER_UID`.
 */
async function getPartnerUserIds(currentUserId: string): Promise<string[]> {
  const ids = new Set<string>();

  const configured = process.env.NEXT_PUBLIC_PARTNER_UID ?? "";
  for (const raw of configured.split(",")) {
    const trimmed = raw.trim();
    if (trimmed && trimmed !== currentUserId) {
      ids.add(trimmed);
    }
  }

  const snapshot = await getDocs(collection(requireFirestore(), "users"));
  for (const userDoc of snapshot.docs) {
    if (userDoc.id !== currentUserId) {
      ids.add(userDoc.id);
    }
  }

  return Array.from(ids);
}

/* ------------------------------------------------------------------ */
/* Read / write (CRUD)                                                 */
/* ------------------------------------------------------------------ */

/** Live subscription to every task of a user. */
export function watchTasks(
  userId: string,
  onTasks: (tasks: Task[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return watchCollection(
    tasksCollection(userId),
    parseTask,
    onTasks,
    onError,
    "Could not read tasks.",
  );
}

/**
 * Full-document write (create or replace) using the task's own id (`setDoc`).
 * When `task.type === "shared"`, mirrors the task into every partner user's
 * `users/{partnerId}/tasks/{taskId}` subcollection as well.
 */
export async function saveTask(userId: string, task: Task): Promise<void> {
  // `time` is legacy: it is only written when an old task still has one, so
  // new and edited tasks never store a time field.
  const { id, time, ...rest } = task;
  const payload = time ? { ...rest, time } : rest;
  await setDoc(taskDocument(userId, id), payload);

  if (task.type === "shared") {
    const partnerIds = await getPartnerUserIds(userId);
    await Promise.all(
      partnerIds.map((partnerId) =>
        setDoc(taskDocument(partnerId, id), payload),
      ),
    );
  }
}

/**
 * Creates a task. The same validation as the form runs here as a last line
 * of defence, so an invalid task can never be written, whatever the caller.
 */
export async function createTask(userId: string, task: Task): Promise<void> {
  const result = createTaskFormSchema().safeParse({
    title: task.title,
    description: task.description,
    date: task.date ?? "",
    type: task.type,
    subtasks: [...task.subtasks],
  });
  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "This task has invalid subtasks.",
    );
  }
  await saveTask(userId, task);
}

/** Partial update of an existing task (`updateDoc`); other fields stay as stored. */
export async function updateTask(
  userId: string,
  taskId: string,
  updates: TaskUpdates,
): Promise<void> {
  const ref = taskDocument(userId, taskId);
  const existing = await getDoc(ref);
  await updateDoc(ref, updates);

  const isShared =
    updates.type === "shared" ||
    (existing.exists() && existing.data()?.type === "shared");
  if (isShared) {
    const partnerIds = await getPartnerUserIds(userId);
    await Promise.all(
      partnerIds.map((partnerId) =>
        updateDoc(taskDocument(partnerId, taskId), updates).catch(() => {
          // Partner copy may not exist yet if this is a partial update.
        }),
      ),
    );
  }
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const ref = taskDocument(userId, taskId);
  const existing = await getDoc(ref);
  const isShared = existing.exists() && existing.data()?.type === "shared";

  await deleteDoc(ref);

  if (isShared) {
    const partnerIds = await getPartnerUserIds(userId);
    await Promise.all(
      partnerIds.map((partnerId) =>
        deleteDoc(taskDocument(partnerId, taskId)),
      ),
    );
  }
}

/* ------------------------------------------------------------------ */
/* Task construction                                                   */
/* ------------------------------------------------------------------ */

/** Builds a new, not-yet-saved task from validated form values. */
export function buildNewTask(userId: string, input: TaskFormSubmission): Task {
  const id = generateId("task");
  const now = new Date();
  return {
    id,
    title: input.title,
    description: input.description,
    date: input.date,
    time: null,
    completed: false,
    // Fresh ids are derived from the task id; ordering follows the form.
    subtasks: input.subtasks.map((subtask, index) => ({
      id: `${id}-${index + 1}`,
      title: subtask.title,
      done: false,
    })),
    doneBy: null,
    type: input.type,
    ...getTaskUpdateFields(now),
    createdAt: now.toISOString(),
    createdBy: userId,
    updatedAt: now.toISOString(),
    updatedBy: userId,
  };
}

/**
 * Applies validated edits to an existing task. Subtask ids and done-state
 * are kept, so editing never loses progress. The task stays completed only
 * while every subtask is still done (adding or unchecking one reopens it),
 * and the legacy due time is dropped.
 */
export function buildEditedTask(
  original: Task,
  input: TaskFormSubmission,
  userId: string,
): Task {
  const now = new Date();
  const completed =
    original.completed && input.subtasks.every((subtask) => subtask.done);
  return {
    ...original,
    title: input.title,
    description: input.description,
    date: input.date,
    time: null,
    type: input.type,
    subtasks: input.subtasks,
    completed,
    doneBy: completed ? (original.doneBy ?? userId) : null,
    ...getTaskUpdateFields(now),
    updatedAt: now.toISOString(),
    updatedBy: userId,
  };
}

/* ------------------------------------------------------------------ */
/* Completion updates                                                  */
/* ------------------------------------------------------------------ */

function getTaskUpdateFields(value = new Date()) {
  return {
    updatedDate: getLocalDate(value),
    updatedTime: getLocalTime(value),
  };
}

/** Returns the task with its completion changed, or undefined if the id is unknown. */
function withTaskCompleted(
  tasks: readonly Task[],
  taskId: string,
  completed: boolean,
  userId: string,
): Task | undefined {
  const target = tasks.find((task) => task.id === taskId);
  if (!target) return undefined;
  return {
    ...target,
    completed,
    doneBy: completed ? userId : null,
    ...getTaskUpdateFields(),
    subtasks: completed
      ? target.subtasks.map((subtask) => ({ ...subtask, done: true }))
      : target.subtasks,
  };
}

/** Returns the task with one subtask changed, or undefined if the id is unknown. */
function withSubtaskDone(
  tasks: readonly Task[],
  taskId: string,
  subtaskId: string,
  done: boolean,
): Task | undefined {
  const target = tasks.find((task) => task.id === taskId);
  if (!target) return undefined;
  return {
    ...target,
    completed: done ? target.completed : false,
    doneBy: done ? target.doneBy : null,
    ...getTaskUpdateFields(),
    subtasks: target.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, done } : subtask,
    ),
  };
}

/** Records who changed the task and when (ISO), alongside the existing local update fields. */
function stampUpdate(task: Task, userId: string): Task {
  return { ...task, updatedAt: new Date().toISOString(), updatedBy: userId };
}

/** Marks a task completed/open and persists it. Resolves to the saved task. */
export async function updateTaskCompletion(
  userId: string,
  tasks: readonly Task[],
  taskId: string,
  completed: boolean,
): Promise<Task | undefined> {
  const changed = withTaskCompleted(tasks, taskId, completed, userId);
  if (!changed) return undefined;
  const updated = stampUpdate(changed, userId);
  await saveTask(userId, updated);
  return updated;
}

/** Checks/unchecks one subtask and persists the task. Resolves to the saved task. */
export async function updateSubtaskCompletion(
  userId: string,
  tasks: readonly Task[],
  taskId: string,
  subtaskId: string,
  done: boolean,
): Promise<Task | undefined> {
  const changed = withSubtaskDone(tasks, taskId, subtaskId, done);
  if (!changed) return undefined;
  const updated = stampUpdate(changed, userId);
  await saveTask(userId, updated);
  return updated;
}

/* ------------------------------------------------------------------ */
/* Today / upcoming selectors (pure; the collection is read once)      */
/* ------------------------------------------------------------------ */

export function selectTasksByGroup(
  tasks: readonly Task[],
  group: TaskGroup,
): Task[] {
  return tasks.filter((task) => getTaskGroup(task) === group);
}

export function selectOpenTasks(tasks: readonly Task[]): Task[] {
  return tasks.filter((task) => !task.completed);
}

/** Dashboard "planned": tasks whose due date is exactly today (unchanged definition). */
export function countPlannedToday(
  tasks: readonly Task[],
  today = getLocalDate(),
): number {
  return tasks.filter((task) => task.date === today).length;
}

/** Dashboard "completed": completed tasks last updated today (unchanged definition). */
export function countCompletedToday(
  tasks: readonly Task[],
  today = getLocalDate(),
): number {
  return tasks.filter((task) => task.completed && task.updatedDate === today)
    .length;
}
