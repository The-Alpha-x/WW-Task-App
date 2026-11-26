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
import {
  getLocalDate,
  getLocalTime,
  isValidDateString,
  isValidTimeString,
} from "@/lib/date-time";
import {
  createEventFormSchema,
  eventToFormValues,
  isEventType,
  type EventFormContext,
  type EventFormSubmission,
  type EventFormValues,
} from "@/lib/events/form";
import type { Event, EventType } from "@/types/event";

/**
 * Single home for every event-related Firestore operation.
 * Path: users/{uid}/events/{eventId} (same tree as tasks, so the existing
 * owner-only rules apply unchanged). Components and hooks must not import
 * firebase/firestore for events; they call this module instead.
 *
 * Errors: every function rejects/throws a plain `Error`. Validation problems
 * carry the first form message; Firestore failures keep their `code`, so the
 * UI can show them with `getFirebaseErrorMessage` / `describeError`.
 *
 * Time: `date`/`time` are local strings (when the event happens);
 * `createdAt`/`updatedAt` are ISO-8601 UTC instants (when the document was
 * written). The two are never mixed.
 */

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

function parseEvent(id: string, value: DocumentData): Event {
  if (
    typeof value.title !== "string" ||
    (value.description != null && typeof value.description !== "string") ||
    typeof value.date !== "string" ||
    !isValidDateString(value.date) ||
    typeof value.time !== "string" ||
    !isValidTimeString(value.time) ||
    !isEventType(value.type) ||
    (value.notes != null && typeof value.notes !== "string") ||
    typeof value.createdAt !== "string" ||
    typeof value.createdBy !== "string" ||
    typeof value.updatedAt !== "string" ||
    typeof value.updatedBy !== "string"
  ) {
    throw new Error(`Event "${id}" has invalid Firestore data.`);
  }

  return {
    id,
    title: value.title,
    description: value.description ?? "",
    date: value.date,
    time: value.time,
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

function eventsCollection(userId: string) {
  return collection(requireFirestore(), "users", userId, "events");
}

function eventDocument(userId: string, eventId: string) {
  return doc(eventsCollection(userId), eventId);
}

function requireIds(userId: string, eventId?: string): void {
  if (!userId) throw new Error("You must be signed in to manage events.");
  if (eventId !== undefined && !eventId) throw new Error("Missing event id.");
}

/* ------------------------------------------------------------------ */
/* Pure helpers (sorting and selection; no Firestore)                  */
/* ------------------------------------------------------------------ */

/** Chronological order: date, then time, then creation, then id (stable). */
function compareEvents(a: Event, b: Event): number {
  return (
    a.date.localeCompare(b.date) ||
    a.time.localeCompare(b.time) ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id)
  );
}

/** Returns a new array in chronological order (earliest first). */
export function sortEvents(events: readonly Event[]): Event[] {
  return [...events].sort(compareEvents);
}

/** Keeps one visibility type; no type means no filtering. */
export function selectEventsByType(
  events: readonly Event[],
  type?: EventType,
): Event[] {
  return type ? events.filter((event) => event.type === type) : [...events];
}

/** Events that have not started yet: later day, or today at/after the current minute. */
export function selectUpcomingEvents(
  events: readonly Event[],
  now = new Date(),
): Event[] {
  const today = getLocalDate(now);
  const nowTime = getLocalTime(now);
  return events.filter(
    (event) =>
      event.date > today || (event.date === today && event.time >= nowTime),
  );
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/**
 * The one place events are queried. Every list function goes through it, so
 * parsing, type filtering and ordering exist once. `constraints` may only
 * filter on `date` (a single-field range needs no composite index);
 * visibility is filtered here in memory for the same reason, and ordering is
 * done in memory because date + time would need a composite index.
 */
async function fetchEvents(
  userId: string,
  constraints: QueryConstraint[],
  type?: EventType,
): Promise<Event[]> {
  requireIds(userId);
  const snapshot = await getDocs(
    query(eventsCollection(userId), ...constraints),
  );
  const events = snapshot.docs.map((item) => parseEvent(item.id, item.data()));
  return sortEvents(selectEventsByType(events, type));
}

export interface EventListOptions {
  /** Only events of this visibility. Omit for both. */
  type?: EventType;
}

/** One event, or `null` when it does not exist. */
export async function getEventById(
  userId: string,
  eventId: string,
): Promise<Event | null> {
  requireIds(userId, eventId);
  const snapshot = await getDoc(eventDocument(userId, eventId));
  const data = snapshot.data();
  return snapshot.exists() && data ? parseEvent(snapshot.id, data) : null;
}

/** Every event of the user (past and future), earliest first. */
export async function getEvents(
  userId: string,
  options: EventListOptions = {},
): Promise<Event[]> {
  return fetchEvents(userId, [], options.type);
}

export interface UpcomingEventsOptions extends EventListOptions {
  /** Maximum number of events to return (positive integer). */
  limit?: number;
  /** The current moment; defaults to `new Date()`. Injectable for tests. */
  now?: Date;
}

/** Events that have not started yet, earliest first. */
export async function getUpcomingEvents(
  userId: string,
  options: UpcomingEventsOptions = {},
): Promise<Event[]> {
  const { limit, now = new Date(), type } = options;
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error("The limit must be a positive whole number.");
  }
  // The query keeps today and later; selectUpcomingEvents then drops today's
  // events whose time has already passed.
  const events = await fetchEvents(
    userId,
    [where("date", ">=", getLocalDate(now))],
    type,
  );
  const upcoming = selectUpcomingEvents(events, now);
  return limit === undefined ? upcoming : upcoming.slice(0, limit);
}

/** Events whose date is between `startDate` and `endDate`, both inclusive (`YYYY-MM-DD`). */
export async function getEventsByDateRange(
  userId: string,
  startDate: string,
  endDate: string,
  options: EventListOptions = {},
): Promise<Event[]> {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    throw new Error("Enter a valid start and end date.");
  }
  if (startDate > endDate) {
    throw new Error("The start date must be on or before the end date.");
  }
  return fetchEvents(
    userId,
    [where("date", ">=", startDate), where("date", "<=", endDate)],
    options.type,
  );
}

/** Live subscription to every event of a user, earliest first (for hooks). */
export function watchEvents(
  userId: string,
  onEvents: (events: Event[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return watchCollection(
    eventsCollection(userId),
    parseEvent,
    onEvents,
    onError,
    "Could not read events.",
    sortEvents,
  );
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

/** Builds a new, not-yet-saved event from validated form values. */
export function buildNewEvent(
  userId: string,
  input: EventFormSubmission,
  now = new Date(),
): Event {
  const instant = now.toISOString();
  return {
    id: generateId("event"),
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
 * Validates, builds and saves a new event (`setDoc`, client-generated id).
 * Validation runs here, so an invalid event can never be written whatever
 * the caller. Resolves to the saved event.
 */
export async function createEvent(
  userId: string,
  values: EventFormValues,
  context: Pick<EventFormContext, "now"> = {},
): Promise<Event> {
  requireIds(userId);
  const result = createEventFormSchema({ now: context.now }).safeParse(values);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "This event is not valid.");
  }
  const event = buildNewEvent(userId, result.data, context.now);
  const { id, ...data } = event;
  await setDoc(eventDocument(userId, id), data);
  return event;
}

/** Fields an edit may change. Audit fields are set by the service, never by the caller. */
export type EventUpdates = Partial<EventFormValues>;

/**
 * Partial update (`updateDoc`). The stored event is read once so the merged
 * result can be validated as a whole; keeping the stored date and time
 * unchanged stays valid even when they are in the past. Only the edited
 * fields plus `updatedAt`/`updatedBy` are written; `createdAt`/`createdBy`
 * are never touched. Resolves to the updated event.
 */
export async function updateEvent(
  userId: string,
  eventId: string,
  updates: EventUpdates,
  context: Pick<EventFormContext, "now"> = {},
): Promise<Event> {
  requireIds(userId, eventId);
  const reference = eventDocument(userId, eventId);
  const snapshot = await getDoc(reference);
  const data = snapshot.data();
  if (!snapshot.exists() || !data)
    throw new Error("This event no longer exists.");
  const current = parseEvent(snapshot.id, data);

  const stored = eventToFormValues(current);
  const result = createEventFormSchema({
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
    throw new Error(result.error.issues[0]?.message ?? "This event is not valid.");
  }

  const changes = {
    ...result.data,
    updatedAt: (context.now ?? new Date()).toISOString(),
    updatedBy: userId,
  };
  await updateDoc(reference, changes);
  return { ...current, ...changes };
}

/** Deletes an event. Deleting one that is already gone is not an error. */
export async function deleteEvent(
  userId: string,
  eventId: string,
): Promise<void> {
  requireIds(userId, eventId);
  await deleteDoc(eventDocument(userId, eventId));
}
