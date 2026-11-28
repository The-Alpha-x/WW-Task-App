import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { requireFirestore } from "@/lib/firebase";
import { generateId } from "@/lib/id";
import {
  createListFormSchema,
  isListType,
  type ListFormValues,
} from "@/lib/lists/form";
import type { ItemList, ListItem } from "@/types/list";

/**
 * Single home for every list-related Firestore operation.
 *
 * Path: the top-level collection `List`, one document per list (id =
 * client-generated UUID). Components and hooks must not import
 * firebase/firestore for lists; they call this module instead.
 *
 * Visibility (enforced by firestore.rules): `shared` lists can be read and
 * edited by either signed-in partner, `individual` lists only by their
 * creator. Because the rules depend on the document, the collection is never
 * read whole: `watchLists` runs two queries (shared lists, and the user's own
 * lists) and merges them.
 *
 * Time: `createdAt`/`updatedAt` are ISO-8601 UTC instants. Lists are sorted
 * by `createdAt`, newest first.
 */

export const LISTS_COLLECTION = "List";

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseList(id: string, value: DocumentData): ItemList {
  if (
    typeof value.title !== "string" ||
    !isListType(value.type) ||
    !Array.isArray(value.items) ||
    (value.notes != null && typeof value.notes !== "string") ||
    typeof value.createdAt !== "string" ||
    typeof value.createdBy !== "string" ||
    (value.updatedAt != null && typeof value.updatedAt !== "string")
  ) {
    throw new Error(`List "${id}" has invalid Firestore data.`);
  }

  const items: ListItem[] = value.items.map((item: unknown) => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.name !== "string" ||
      typeof item.quantity !== "number" ||
      !Number.isFinite(item.quantity) ||
      (item.checked != null && typeof item.checked !== "boolean")
    ) {
      throw new Error(`List "${id}" has invalid item data.`);
    }
    // Lists saved before ticking existed have no `checked`: read as not bought.
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      checked: item.checked ?? false,
    };
  });

  return {
    id,
    title: value.title,
    type: value.type,
    items,
    notes: value.notes ?? "",
    createdAt: value.createdAt,
    createdBy: value.createdBy,
    updatedAt: value.updatedAt ?? value.createdAt,
  };
}

/* ------------------------------------------------------------------ */
/* References                                                          */
/* ------------------------------------------------------------------ */

function listsCollection() {
  return collection(requireFirestore(), LISTS_COLLECTION);
}

function listDocument(listId: string) {
  return doc(listsCollection(), listId);
}

function requireIds(userId: string, listId?: string): void {
  if (!userId) throw new Error("You must be signed in to manage lists.");
  if (listId !== undefined && !listId) throw new Error("Missing list id.");
}

/* ------------------------------------------------------------------ */
/* Sorting                                                             */
/* ------------------------------------------------------------------ */

/** Newest first by `createdAt`, then id so equal timestamps keep a stable order. */
function compareListsNewestFirst(a: ItemList, b: ItemList): number {
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

/** Returns a new array, the most recently created list first. */
export function sortLists(lists: readonly ItemList[]): ItemList[] {
  return [...lists].sort(compareListsNewestFirst);
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/**
 * Live subscription to every list the user may see, newest first: all shared
 * lists plus the user's own lists. Calls `onLists` once both queries have
 * answered, then again on every change.
 */
export function watchLists(
  userId: string,
  onLists: (lists: ItemList[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const shared = new Map<string, ItemList>();
  const own = new Map<string, ItemList>();
  let sharedReady = false;
  let ownReady = false;

  const emit = () => {
    if (!sharedReady || !ownReady) return;
    onLists(sortLists([...new Map([...shared, ...own]).values()]));
  };

  const listen = (
    target: Map<string, ItemList>,
    constraint: ReturnType<typeof where>,
    markReady: () => void,
  ) =>
    onSnapshot(
      query(listsCollection(), constraint),
      (snapshot) => {
        try {
          target.clear();
          for (const item of snapshot.docs) {
            target.set(item.id, parseList(item.id, item.data()));
          }
        } catch (error) {
          onError(
            error instanceof Error ? error : new Error("Could not read lists."),
          );
          return;
        }
        markReady();
        emit();
      },
      onError,
    );

  const stopShared = listen(shared, where("type", "==", "shared"), () => {
    sharedReady = true;
  });
  const stopOwn = listen(own, where("createdBy", "==", userId), () => {
    ownReady = true;
  });

  return () => {
    stopShared();
    stopOwn();
  };
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

function validate(values: ListFormValues) {
  const result = createListFormSchema().safeParse(values);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "This list is not valid.");
  }
  return result.data;
}

/**
 * Validates, builds and saves a new list in the `List` collection
 * (`setDoc`, client-generated id). Validation runs here, so an invalid list
 * can never be written whatever the caller. Resolves to the saved list.
 */
export async function createList(
  userId: string,
  values: ListFormValues,
  now = new Date(),
): Promise<ItemList> {
  requireIds(userId);
  const data = validate(values);
  const instant = now.toISOString();
  const list: ItemList = {
    id: generateId("list"),
    title: data.title,
    type: data.type,
    items: data.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      checked: item.checked,
    })),
    notes: data.notes,
    createdAt: instant,
    createdBy: userId,
    updatedAt: instant,
  };
  const { id, ...document } = list;
  await setDoc(listDocument(id), document);
  return list;
}

/**
 * Saves edits to a list (`updateDoc`). Only the edited fields plus
 * `updatedAt` are written; `createdAt` and `createdBy` are never touched, so
 * the list keeps its place in the newest-first order.
 */
export async function updateList(
  userId: string,
  listId: string,
  values: ListFormValues,
  now = new Date(),
): Promise<void> {
  requireIds(userId, listId);
  const data = validate(values);
  await updateDoc(listDocument(listId), {
    title: data.title,
    type: data.type,
    items: data.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      checked: item.checked,
    })),
    notes: data.notes,
    updatedAt: now.toISOString(),
  });
}

/**
 * Ticks or unticks one item (e.g. "bought") and saves the list's items with a
 * new `updatedAt`. Nothing else on the list changes.
 */
export async function setListItemChecked(
  userId: string,
  list: ItemList,
  itemId: string,
  checked: boolean,
  now = new Date(),
): Promise<void> {
  requireIds(userId, list.id);
  await updateDoc(listDocument(list.id), {
    items: list.items.map((item) =>
      item.id === itemId ? { ...item, checked } : item,
    ),
    updatedAt: now.toISOString(),
  });
}

/** Deletes a list. Deleting one that is already gone is not an error. */
export async function deleteList(userId: string, listId: string): Promise<void> {
  requireIds(userId, listId);
  await deleteDoc(listDocument(listId));
}
