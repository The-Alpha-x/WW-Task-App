import type { TaskType } from "@/types/task";

/** Who a list is for. Same two values as tasks, events and memories. */
export type ListType = TaskType;

/** One line of a list, e.g. "Milk" x 2. */
export interface ListItem {
  id: string;
  name: string;
  /** Number of units wanted: a whole number from 1 to 999. */
  quantity: number;
  /** True once the item has been bought / ticked off. */
  checked: boolean;
}

/**
 * A list (grocery list, packing list, ...). Stored in the top-level Firestore
 * collection `List`, one document per list.
 */
export interface ItemList {
  id: string;
  title: string;
  /** `shared` lists are visible to both partners, `individual` only to the creator. */
  type: ListType;
  items: readonly ListItem[];
  /** Optional; `""` when not given. */
  notes: string;
  /** When the list was created: ISO-8601 UTC instant. Lists are sorted by this, newest first. */
  createdAt: string;
  /** ID of the user who created the list. */
  createdBy: string;
  /** When the list was last changed: ISO-8601 UTC instant. */
  updatedAt: string;
}
