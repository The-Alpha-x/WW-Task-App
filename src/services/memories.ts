import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { requireFirestore, watchCollection } from "@/lib/firebase";
import { generateId } from "@/lib/id";
import { getLocalDate, isValidDateString, isValidTimeString } from "@/lib/date-time";
import {
  createMemoryFormSchema,
  isMemoryType,
  memoryToFormValues,
  type MemoryFormContext,
  type MemoryFormSubmission,
  type MemoryFormValues,
} from "@/lib/memories/form";
import type { Memory, MemoryType } from "@/types/memory";

/**
 * Single home for every memory-related Firestore operation.
 * Path: users/{uid}/memories/{memoryId} (same tree as tasks and events, so the
 * existing owner-only rules apply unchanged). Components and hooks must not
 * import firebase/firestore for memories; they call this module instead.
 *
 * Errors: every function rejects/throws a plain `Error`. Validation problems
 * carry the first form message; Firestore failures keep their `code`, so the
 * UI can show them with `getFirebaseErrorMessage` / `describeError`.
 *
 * Time: `date`/`time` are local strings (when the memory HAPPENED);
 * `createdAt`/`updatedAt` are ISO-8601 UTC instants (when the document was
 * SAVED). The two are never mixed: every ordering and range here uses
 * `date`/`time`, and `createdAt` is only a tie-breaker.
 */

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

function parseMemory(id: string, value: DocumentData): Memory {
  // `time` is always written (null when not given); an absent field is read
  // as null too so a hand-made document without it still loads.
  const time: unknown = value.time ?? null;
  if (
    typeof value.title !== "string" ||
    (value.description != null && typeof value.description !== "string") ||
    typeof value.date !== "string" ||
    !isValidDateString(value.date) ||
    (time !== null && (typeof time !== "string" || !isValidTimeString(time))) ||
    !isMemoryType(value.type) ||
    (value.notes != null && typeof value.notes !== "string") ||
    typeof value.createdAt !== "string" ||
    typeof value.createdBy !== "string" ||
    typeof value.updatedAt !== "string" ||
    typeof value.updatedBy !== "string"
  ) {
    throw new Error(`Memory "${id}" has invalid Firestore data.`);
  }

  return {
    id,
    title: value.title,
    description: value.description ?? "",
    date: value.date,
    time,
    type: value.type,
    notes: value.notes ?? "",
    createdAt: value.createdAt,
    createdBy: value.createdBy,
    updatedAt: value.updatedAt,
    updatedBy: value.updatedBy,
  };
}

/* ------------------------------------------------------------------ */
/* References                                                          */
/* ------------------------------------------------------------------ */

function memoriesCollection(userId: string) {
  return collection(requireFirestore(), "users", userId, "memories");
}

function memoryDocument(userId: string, memoryId: string) {
  return doc(memoriesCollection(userId), memoryId);
}

function requireIds(userId: string, memoryId?: string): void {
  if (!userId) throw new Error("You must be signed in to manage memories.");
  if (memoryId !== undefined && !memoryId)
    throw new Error("Missing memory id.");
}

/* ------------------------------------------------------------------ */
/* Pure helpers (sorting and selection; no Firestore)                  */
/* ------------------------------------------------------------------ */

/**
 * Newest first, by WHEN IT HAPPENED: date, then time (a memory without a time
 * counts as the start of its day, so it comes after timed memories of the
 * same day), then save time, then id (stable). `createdAt` is only a
 * tie-breaker and never decides the order of different days.
 */
function compareMemoriesNewestFirst(a: Memory, b: Memory): number {
  return (
    b.date.localeCompare(a.date) ||
    (b.time ?? "").localeCompare(a.time ?? "") ||
    b.createdAt.localeCompare(a.createdAt) ||
    b.id.localeCompare(a.id)
  );
}

/** Returns a new array, most recent memory first (by memory date, not save time). */
export function sortMemories(memories: readonly Memory[]): Memory[] {
  return [...memories].sort(compareMemoriesNewestFirst);
}

/** Keeps one visibility type; no type means no filtering. */
export function selectMemoriesByType(
  memories: readonly Memory[],
  type?: MemoryType,
): Memory[] {
  return type
    ? memories.filter((memory) => memory.type === type)
    : [...memories];
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/**
 * The one place memories are queried. Every list function goes through it, so
 * parsing, type filtering and ordering exist once. `constraints` may only
 * filter on `date` (a single-field range needs no composite index);
 * visibility is filtered here in memory for the same reason, and ordering is
 * done in memory because date + time would need a composite index.
 */
async function fetchMemories(
  userId: string,
  constraints: QueryConstraint[],
  type?: MemoryType,
): Promise<Memory[]> {
  requireIds(userId);
  const snapshot = await getDocs(
    query(memoriesCollection(userId), ...constraints),
  );
  const memories = snapshot.docs.map((item) =>
    parseMemory(item.id, item.data()),
  );
  return sortMemories(selectMemoriesByType(memories, type));
}

export interface MemoryListOptions {
  /** Only memories of this visibility. Omit for both. */
  type?: MemoryType;
}

/** One memory, or `null` when it does not exist. */
export async function getMemoryById(
  userId: string,
  memoryId: string,
): Promise<Memory | null> {
  requireIds(userId, memoryId);
  const snapshot = await getDoc(memoryDocument(userId, memoryId));
  const data = snapshot.data();
  return snapshot.exists() && data ? parseMemory(snapshot.id, data) : null;
}

/** Every memory of the user, most recent (by memory date) first. */
export async function getMemories(
  userId: string,
  options: MemoryListOptions = {},
): Promise<Memory[]> {
  return fetchMemories(userId, [], options.type);
}

/** How many memories `getRecentMemories` returns when no `limit` is given. */
export const DEFAULT_RECENT_MEMORIES_LIMIT = 5;

export interface RecentMemoriesOptions extends MemoryListOptions {
  /** Maximum number of memories to return (positive integer). Default 5. */
  limit?: number;
  /** The current moment; defaults to `new Date()`. Injectable for tests. */
  now?: Date;
}

/**
 * The memories that happened most recently, newest first. "Recent" means the
 * memory `date`, NOT when it was saved: a memory from last week that was
 * added today ranks below one from yesterday that was added last month.
 */
export async function getRecentMemories(
  userId: string,
  options: RecentMemoriesOptions = {},
): Promise<Memory[]> {
  const {
    limit = DEFAULT_RECENT_MEMORIES_LIMIT,
    now = new Date(),
    type,
  } = options;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("The limit must be a positive whole number.");
  }
  // `date <= today` keeps the list to memories that have happened and drops
  // anything dated later (not creatable through this service).
  const memories = await fetchMemories(
    userId,
    [where("date", "<=", getLocalDate(now))],
    type,
  );
  return memories.slice(0, limit);
}

/** Memories whose date is between `startDate` and `endDate`, both inclusive (`YYYY-MM-DD`). Newest first. */
export async function getMemoriesByDateRange(
  userId: string,
  startDate: string,
  endDate: string,
  options: MemoryListOptions = {},
): Promise<Memory[]> {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    throw new Error("Enter a valid start and end date.");
  }
  if (startDate > endDate) {
    throw new Error("The start date must be on or before the end date.");
  }
  return fetchMemories(
    userId,
    [where("date", ">=", startDate), where("date", "<=", endDate)],
    options.type,
  );
}

/** Live subscription to every memory of a user, newest first (for hooks). */
export function watchMemories(
  userId: string,
  onMemories: (memories: Memory[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return watchCollection(
    memoriesCollection(userId),
    parseMemory,
    onMemories,
    onError,
    "Could not read memories.",
    sortMemories,
  );
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

/** Builds a new, not-yet-saved memory from validated form values. */
export function buildNewMemory(
  userId: string,
  input: MemoryFormSubmission,
  now = new Date(),
): Memory {
  const instant = now.toISOString();
  return {
    id: generateId("memory"),
    title: input.title,
    description: input.description,
    date: input.date,
    time: input.time,
    type: input.type,
    notes: input.notes,
    createdAt: instant,
    createdBy: userId,
    updatedAt: instant,
    updatedBy: userId,
  };
}

/**
 * Validates, builds and saves a new memory (`setDoc`, client-generated id).
 * Validation runs here, so an invalid memory can never be written whatever
 * the caller. A memory without a time is stored with `time: null`. Resolves
 * to the saved memory.
 */
export async function createMemory(
  userId: string,
  values: MemoryFormValues,
  context: Pick<MemoryFormContext, "now"> = {},
): Promise<Memory> {
  requireIds(userId);
  const result = createMemoryFormSchema({ now: context.now }).safeParse(values);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "This memory is not valid.");
  }
  const memory = buildNewMemory(userId, result.data, context.now);
  const { id, ...data } = memory;
  await setDoc(memoryDocument(userId, id), data);
  return memory;
}

/** Fields an edit may change. Audit fields are set by the service, never by the caller. */
export type MemoryUpdates = Partial<MemoryFormValues>;

/**
 * Partial update (`updateDoc`). The stored memory is read once so the merged
 * result can be validated as a whole. Only the edited fields plus
 * `updatedAt`/`updatedBy` are written; `createdAt`/`createdBy` are never
 * touched, and changing `date` never changes `createdAt` (or the reverse).
 * Pass `time: ""` to remove the time. Resolves to the updated memory.
 */
export async function updateMemory(
  userId: string,
  memoryId: string,
  updates: MemoryUpdates,
  context: Pick<MemoryFormContext, "now"> = {},
): Promise<Memory> {
  requireIds(userId, memoryId);
  const reference = memoryDocument(userId, memoryId);
  const snapshot = await getDoc(reference);
  const data = snapshot.data();
  if (!snapshot.exists() || !data)
    throw new Error("This memory no longer exists.");
  const current = parseMemory(snapshot.id, data);

  const stored = memoryToFormValues(current);
  const result = createMemoryFormSchema({
    now: context.now,
    original: { date: current.date, time: current.time },
  }).safeParse({
    title: updates.title ?? stored.title,
    description: updates.description ?? stored.description,
    date: updates.date ?? stored.date,
    time: updates.time ?? stored.time,
    type: updates.type ?? stored.type,
    notes: updates.notes ?? stored.notes,
  });
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "This memory is not valid.");
  }

  const changes = {
    ...result.data,
    updatedAt: (context.now ?? new Date()).toISOString(),
    updatedBy: userId,
  };
  await updateDoc(reference, changes);
  return { ...current, ...changes };
}

/** Deletes a memory. Deleting one that is already gone is not an error. */
export async function deleteMemory(
  userId: string,
  memoryId: string,
): Promise<void> {
  requireIds(userId, memoryId);
  await deleteDoc(memoryDocument(userId, memoryId));
}
