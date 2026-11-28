import { z } from "zod";
import type { ItemList, ListType } from "@/types/list";

/**
 * Zod schema and form helpers for creating and editing lists. No React and no
 * Firebase, so the same rules serve the form (via zodResolver) and the
 * service-level guard.
 */

export const LIST_TITLE_MAX = 100;
export const LIST_ITEM_NAME_MAX = 100;
export const LIST_ITEMS_MAX = 100;
export const LIST_QUANTITY_MAX = 999;
export const LIST_NOTES_MAX = 2000;

export const LIST_TYPES: readonly {
  value: ListType;
  label: string;
  hint: string;
}[] = [
  { value: "individual", label: "Individual", hint: "Just for you" },
  { value: "shared", label: "Shared", hint: "For both of you" },
];

export interface ListItemFormValues {
  id: string;
  name: string;
  /** `NaN` while the quantity box is empty (react-hook-form `valueAsNumber`). */
  quantity: number;
  /** Purchased state; kept as-is when a list is edited. */
  checked: boolean;
}

export interface ListFormValues {
  title: string;
  type: ListType;
  items: ListItemFormValues[];
  notes: string;
}

export type ListFormSubmission = ListFormValues;

export function isListType(value: unknown): value is ListType {
  return value === "shared" || value === "individual";
}

const itemSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .trim()
    .min(1, "Enter an item name or remove this row.")
    .max(
      LIST_ITEM_NAME_MAX,
      `Keep item names to ${LIST_ITEM_NAME_MAX} characters or fewer.`,
    ),
  quantity: z
    .number({ message: `Enter a number from 1 to ${LIST_QUANTITY_MAX}.` })
    .int(`Enter a whole number from 1 to ${LIST_QUANTITY_MAX}.`)
    .min(1, `Enter a number from 1 to ${LIST_QUANTITY_MAX}.`)
    .max(LIST_QUANTITY_MAX, `Enter a number from 1 to ${LIST_QUANTITY_MAX}.`),
  checked: z.boolean(),
});

export function createListFormSchema() {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, "Please enter a list title.")
      .max(
        LIST_TITLE_MAX,
        `Keep the title to ${LIST_TITLE_MAX} characters or fewer.`,
      ),
    type: z.enum(["individual", "shared"], {
      message: "Choose shared or individual.",
    }),
    items: z
      .array(itemSchema)
      .min(1, "Add at least one item.")
      .max(LIST_ITEMS_MAX, `A list can have up to ${LIST_ITEMS_MAX} items.`),
    notes: z
      .string()
      .trim()
      .max(
        LIST_NOTES_MAX,
        `Keep the notes to ${LIST_NOTES_MAX} characters or fewer.`,
      ),
  });
}

export function createEmptyListForm(newItemId: string): ListFormValues {
  return {
    title: "",
    type: "shared",
    items: [{ id: newItemId, name: "", quantity: 1, checked: false }],
    notes: "",
  };
}

export function listToFormValues(list: ItemList): ListFormValues {
  return {
    title: list.title,
    type: list.type,
    items: list.items.map((item) => ({ ...item })),
    notes: list.notes,
  };
}
