"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { formatListDate } from "@/lib/lists/display";
import type { ItemList } from "@/types/list";

export interface ListDetailsModalProps {
  /** The open list, or null when closed. Pass the live list so ticks show at once. */
  list: ItemList | null;
  onClose: () => void;
  onToggleItem: (list: ItemList, itemId: string, checked: boolean) => void;
  onEdit: (list: ItemList) => void;
  onDelete: (listId: string) => void;
}

/**
 * The opened list: items to tick off as purchased, a progress line, notes,
 * and Edit / Delete (delete asks for a second press).
 */
export function ListDetailsModal({
  list,
  onClose,
  onToggleItem,
  onEdit,
  onDelete,
}: ListDetailsModalProps) {
  // Keep the last list while the exit animation plays.
  const [shown, setShown] = useState<ItemList | null>(list);
  if (list && list !== shown) setShown(list);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const current = list ?? shown;
  const total = current?.items.length ?? 0;
  const done = current?.items.filter((item) => item.checked).length ?? 0;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const close = () => {
    setConfirmingDelete(false);
    onClose();
  };

  return (
    <Modal
      open={Boolean(list)}
      onClose={close}
      title={current?.title ?? "List"}
      description={
        current
          ? `${current.type === "shared" ? "Shared" : "Individual"} · ${formatListDate(current.createdAt)}`
          : undefined
      }
      size="lg"
      footer={
        current && (
          <>
            {confirmingDelete ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setConfirmingDelete(false);
                    onDelete(current.id);
                  }}
                >
                  Delete list
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    close();
                    onEdit(current);
                  }}
                >
                  Edit
                </Button>
              </>
            )}
          </>
        )
      }
    >
      {current && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tabular-nums text-on-dark">
              {done} of {total} purchased
            </span>
            <span
              role="progressbar"
              aria-label="Items purchased"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1 flex-1 overflow-hidden rounded-full bg-on-dark/15"
            >
              <span
                className="block h-full rounded-full bg-lime transition-[width] duration-base ease-standard"
                style={{ width: `${percent}%` }}
              />
            </span>
          </div>

          <ul
            aria-label={`Items in ${current.title}`}
            className="flex flex-col divide-y divide-glass-border/10 border-y border-glass-border/10"
          >
            {current.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={item.checked}
                  onClick={() => onToggleItem(current, item.id, !item.checked)}
                  className="flex w-full items-center gap-3 rounded-sm px-1 py-3 text-left transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors",
                      item.checked
                        ? "border-lime bg-lime text-ink"
                        : "border-on-dark-muted/50 bg-transparent",
                    )}
                  >
                    {item.checked && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 break-words text-base font-medium transition-colors",
                      item.checked
                        ? "text-on-dark-muted line-through decoration-on-dark-muted/50"
                        : "text-on-dark",
                    )}
                  >
                    {item.name}
                  </span>
                  <span className="shrink-0 rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-semibold tabular-nums text-on-dark-muted">
                    <span aria-hidden="true">×</span>
                    <span className="sr-only">quantity </span>
                    {item.quantity}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {current.notes && (
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-on-dark-muted">
                Notes
              </h3>
              <p className="whitespace-pre-line text-sm leading-snug text-on-dark-muted">
                {current.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
