"use client";

import { useState } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { generateId } from "@/lib/id";
import {
  LIST_ITEM_NAME_MAX,
  LIST_ITEMS_MAX,
  LIST_QUANTITY_MAX,
  type ListFormValues,
} from "@/lib/lists/form";
import { cn } from "@/lib/cn";

export interface ListItemsFieldProps {
  form: UseFormReturn<ListFormValues>;
}

/**
 * Dynamic item editor (name + quantity per row) built on React Hook Form's
 * `useFieldArray`. Rows ease in and out; motion is off with reduced-motion.
 * Enter in a name box adds the next row instead of submitting the form.
 */
export function ListItemsField({ form }: ListItemsFieldProps) {
  const reduce = useReducedMotion();
  const duration = reduce ? 0 : 0.2;
  const {
    control,
    register,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
    keyName: "fieldKey",
  });
  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const [focusItemId, setFocusItemId] = useState<string | null>(null);

  const filled = watchedItems.filter((item) => item?.name?.trim()).length;
  const atLimit = fields.length >= LIST_ITEMS_MAX;
  const listError = errors.items?.message ?? errors.items?.root?.message;

  const handleAdd = () => {
    if (atLimit) return;
    const id = generateId("item");
    append({ id, name: "", quantity: 1, checked: false });
    setFocusItemId(id);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="form-section__title">Items</h2>
        <p
          className="rounded-full bg-input px-3 py-1 type-caption font-semibold text-on-dark-muted ring-1 ring-field"
          aria-live="polite"
        >
          {filled} {filled === 1 ? "item" : "items"}
        </p>
      </div>

      <ul className="flex flex-col">
        <AnimatePresence initial={false}>
          {fields.map((item, index) => {
            const nameError = errors.items?.[index]?.name?.message;
            const quantityError = errors.items?.[index]?.quantity?.message;
            const error = nameError ?? quantityError;
            const inputId = `list-item-${item.id}`;
            return (
              <motion.li
                key={item.fieldKey}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration, ease: [0.2, 0, 0, 1] }}
                className="overflow-hidden"
              >
                {/* padding lives inside so the height animation has no margin jump */}
                <div className="pb-3">
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-md border bg-input pl-4 pr-2 py-1 transition-[border-color,box-shadow] duration-fast sm:gap-3",
                      error
                        ? "border-danger ring-1 ring-inset ring-danger"
                        : "border-field hover:border-on-dark-muted/60 focus-within:border-ring focus-within:ring-1 focus-within:ring-inset focus-within:ring-ring",
                    )}
                  >
                    <label className="sr-only" htmlFor={inputId}>
                      Item {index + 1} name
                    </label>
                    <input
                      id={inputId}
                      {...register(`items.${index}.name`)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        if (watchedItems[index]?.name?.trim() && !atLimit) {
                          handleAdd();
                        }
                      }}
                      autoFocus={item.id === focusItemId}
                      autoComplete="off"
                      maxLength={LIST_ITEM_NAME_MAX}
                      aria-invalid={nameError ? true : undefined}
                      aria-describedby={error ? `${inputId}-error` : undefined}
                      placeholder="Item name"
                      className="h-12 min-w-0 flex-1 bg-transparent text-base font-medium text-on-dark outline-none placeholder:text-subtle-text"
                    />

                    <span aria-hidden="true" className="h-6 w-px bg-field" />

                    <label className="sr-only" htmlFor={`${inputId}-qty`}>
                      Item {index + 1} quantity
                    </label>
                    <input
                      id={`${inputId}-qty`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={LIST_QUANTITY_MAX}
                      step={1}
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                      aria-invalid={quantityError ? true : undefined}
                      aria-describedby={error ? `${inputId}-error` : undefined}
                      className="h-12 w-16 shrink-0 bg-transparent text-center text-base font-semibold tabular-nums text-on-dark outline-none"
                    />

                    <button
                      type="button"
                      aria-label={`Remove item ${index + 1}`}
                      onClick={() => remove(index)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-dark-muted transition-colors duration-fast hover:bg-danger/15 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </div>
                  {error && (
                    <p
                      id={`${inputId}-error`}
                      role="alert"
                      className="mt-2 px-1 text-sm font-semibold text-danger"
                    >
                      {error}
                    </p>
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {listError && (
        <p role="alert" className="mb-2 text-sm font-semibold text-danger">
          {listError}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="md"
        leftIcon={<Plus aria-hidden="true" size={18} />}
        onClick={handleAdd}
        disabled={atLimit}
        className="mt-2 w-full"
      >
        {atLimit ? `Limit of ${LIST_ITEMS_MAX} reached` : "Add item"}
      </Button>
    </div>
  );
}
