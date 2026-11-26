import {
  collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc,
  updateDoc, where, type DocumentData, type Unsubscribe,
} from "firebase/firestore";
import { requireFirestore } from "@/lib/firebase";
import { generateId } from "@/lib/id";
import { getLocalDate, isValidDateString, isValidTimeString } from "@/lib/date-time";
import {
  createMemoryFormSchema, isMemoryType, memoryToFormValues,
  type MemoryFormContext, type MemoryFormSubmission, type MemoryFormValues,
} from "@/lib/memories/form";
import type { Memory, MemoryType } from "@/types/memory";

/** All memories live in the top-level `memories` collection. Shared records
 * are visible to both signed-in users; individual records are visible only
 * to their creator. */
function memoriesCollection() { return collection(requireFirestore(), "memories"); }
function memoryDocument(id: string) { return doc(memoriesCollection(), id); }
function requireIds(userId: string, id?: string) {
  if (!userId) throw new Error("You must be signed in to manage memories.");
  if (id !== undefined && !id) throw new Error("Missing memory id.");
}
function parseMemory(id: string, value: DocumentData): Memory {
  const time: unknown = value.time ?? null;
  if (typeof value.title !== "string" || typeof value.date !== "string" ||
    !isValidDateString(value.date) || (time !== null &&
      (typeof time !== "string" || !isValidTimeString(time))) ||
    !isMemoryType(value.type) || typeof value.createdAt !== "string" ||
    typeof value.createdBy !== "string" || typeof value.updatedAt !== "string" ||
    typeof value.updatedBy !== "string" ||
    (value.description != null && typeof value.description !== "string") ||
    (value.notes != null && typeof value.notes !== "string")) {
    throw new Error(`Memory "${id}" has invalid Firestore data.`);
  }
  return { id, title: value.title, description: value.description ?? "", date: value.date,
    time, type: value.type, notes: value.notes ?? "", createdAt: value.createdAt,
    createdBy: value.createdBy, updatedAt: value.updatedAt, updatedBy: value.updatedBy };
}
function newestFirst(a: Memory, b: Memory) {
  return b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? "") ||
    b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}
export function sortMemories(items: readonly Memory[]) { return [...items].sort(newestFirst); }
export function selectMemoriesByType(items: readonly Memory[], type?: MemoryType) {
  return type ? items.filter(x => x.type === type) : [...items];
}
function visibleToUser(items: Memory[], userId: string) {
  return items.filter(x => x.type === "shared" || x.createdBy === userId);
}
async function fetchMemories(userId: string, type?: MemoryType) {
  requireIds(userId);
  const db = requireFirestore();
  const [shared, own] = await Promise.all([
    getDocs(query(collection(db, "memories"), where("type", "==", "shared"))),
    getDocs(query(collection(db, "memories"), where("createdBy", "==", userId))),
  ]);
  const byId = new Map<string, Memory>();
  for (const snap of [...shared.docs, ...own.docs]) byId.set(snap.id, parseMemory(snap.id, snap.data()));
  return sortMemories(selectMemoriesByType(visibleToUser([...byId.values()], userId), type));
}
export interface MemoryListOptions { type?: MemoryType }
export async function getMemoryById(userId: string, id: string): Promise<Memory | null> {
  requireIds(userId, id);
  const snap = await getDoc(memoryDocument(id));
  if (!snap.exists()) return null;
  const item = parseMemory(snap.id, snap.data());
  return item.type === "shared" || item.createdBy === userId ? item : null;
}
export async function getMemories(userId: string, options: MemoryListOptions = {}) {
  return fetchMemories(userId, options.type);
}
export const DEFAULT_RECENT_MEMORIES_LIMIT = 5;
export async function getRecentMemories(userId: string, options: MemoryListOptions & { limit?: number; now?: Date } = {}) {
  const { limit = DEFAULT_RECENT_MEMORIES_LIMIT, now = new Date(), type } = options;
  if (!Number.isInteger(limit) || limit < 1) throw new Error("The limit must be a positive whole number.");
  return (await fetchMemories(userId, type)).filter(item => item.date <= getLocalDate(now)).slice(0, limit);
}
export async function getMemoriesByDateRange(userId: string, start: string, end: string, options: MemoryListOptions = {}) {
  if (!isValidDateString(start) || !isValidDateString(end) || start > end) throw new Error("Enter a valid start and end date.");
  return (await fetchMemories(userId, options.type)).filter(item => item.date >= start && item.date <= end);
}
export function watchMemories(userId: string, onItems: (items: Memory[]) => void, onError: (error: Error) => void): Unsubscribe {
  requireIds(userId);
  const db = requireFirestore();
  const refs = [
    query(collection(db, "memories"), where("type", "==", "shared")),
    query(collection(db, "memories"), where("createdBy", "==", userId)),
  ];
  const snapshots = new Map<number, Memory[]>();
  let closed = false;
  const unsubscribers = refs.map((ref, index) => onSnapshot(ref, snap => {
    try {
      snapshots.set(index, snap.docs.map(d => parseMemory(d.id, d.data())));
      if (snapshots.size === 2 && !closed) {
        const merged = new Map<string, Memory>();
        for (const list of snapshots.values()) for (const item of list) merged.set(item.id, item);
        onItems(sortMemories(visibleToUser([...merged.values()], userId)));
      }
    } catch (error) { onError(error instanceof Error ? error : new Error("Could not read memories.")); }
  }, error => onError(error)));
  return () => { closed = true; unsubscribers.forEach(unsub => unsub()); };
}
export function buildNewMemory(userId: string, input: MemoryFormSubmission, now = new Date()): Memory {
  const stamp = now.toISOString();
  return { id: generateId("memory"), ...input, createdAt: stamp, createdBy: userId, updatedAt: stamp, updatedBy: userId };
}
export async function createMemory(userId: string, values: MemoryFormValues, context: Pick<MemoryFormContext, "now"> = {}) {
  requireIds(userId);
  const parsed = createMemoryFormSchema({ now: context.now }).safeParse(values);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "This memory is not valid.");
  const memory = buildNewMemory(userId, parsed.data, context.now);
  const { id, ...data } = memory;
  await setDoc(memoryDocument(id), data);
  return memory;
}
export type MemoryUpdates = Partial<MemoryFormValues>;
export async function updateMemory(userId: string, id: string, updates: MemoryUpdates, context: Pick<MemoryFormContext, "now"> = {}) {
  requireIds(userId, id);
  const ref = memoryDocument(id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("This memory no longer exists.");
  const current = parseMemory(snap.id, snap.data());
  if (current.type !== "shared" && current.createdBy !== userId) throw new Error("You cannot edit this memory.");
  const old = memoryToFormValues(current);
  const parsed = createMemoryFormSchema({ now: context.now, original: { date: current.date, time: current.time } }).safeParse({
    title: updates.title ?? old.title, description: updates.description ?? old.description,
    date: updates.date ?? old.date, time: updates.time ?? old.time ?? "",
    type: updates.type ?? old.type, notes: updates.notes ?? old.notes,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "This memory is not valid.");
  const changes = { ...parsed.data, updatedAt: (context.now ?? new Date()).toISOString(), updatedBy: userId };
  await updateDoc(ref, changes);
  return { ...current, ...changes };
}
export async function deleteMemory(userId: string, id: string) {
  requireIds(userId, id);
  const ref = memoryDocument(id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const item = parseMemory(snap.id, snap.data());
  if (item.type !== "shared" && item.createdBy !== userId) throw new Error("You cannot delete this memory.");
  await deleteDoc(ref);
}
