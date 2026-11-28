"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ListChecks, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { toast } from "@/components/ui/Toaster";
import { useAction } from "@/hooks/useAction";
import { listToFormValues, type ListFormValues } from "@/lib/lists/form";
import { ADD_LIST_HREF } from "@/lib/navigation";
import { deleteList, setListItemChecked, updateList } from "@/services/lists";
import type { ItemList } from "@/types/list";
import { ListCard } from "./ListCard";
import { ListDetailsModal } from "./ListDetailsModal";
import { ListForm } from "./ListForm";

export interface ListsOverviewProps {
  /** Already sorted newest first (by `createdAt`) by the service. */
  lists: readonly ItemList[];
  userId: string;
  userName: string;
}

/** Item Lists page body: header, add button and the lists, newest first. */
export function ListsOverview({ lists, userId, userName }: ListsOverviewProps) {
  const reduce = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ItemList | null>(null);
  // Look the open list up live, so ticks show immediately.
  const openList = lists.find((list) => list.id === openId) ?? null;
  const {
    run,
    pending: saving,
    error: saveError,
  } = useAction("Could not update this list.");

  const handleSaveEdit = async (values: ListFormValues) => {
    if (!editing) return;
    const ok = await run(() => updateList(userId, editing.id, values));
    if (ok) {
      setEditing(null);
      toast.success("List updated", values.title.trim());
    } else {
      toast.error(
        "Could not update list",
        "Please check your details and try again.",
      );
    }
  };

  const handleToggleItem = (list: ItemList, itemId: string, checked: boolean) => {
    void run(() => setListItemChecked(userId, list, itemId, checked)).then((ok) => {
      if (!ok) toast.error("Could not update item", "Please try again.");
    });
  };

  const handleDelete = async (listId: string) => {
    const title = lists.find((list) => list.id === listId)?.title;
    const ok = await run(() => deleteList(userId, listId));
    if (ok) {
      setOpenId(null);
      toast.success("List deleted", title);
    } else {
      toast.error("Could not delete list", "Please try again.");
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="type-display-lg text-on-dark">Item Lists</h1>
          <p className="type-body text-on-dark-muted">
            {lists.length === 0
              ? "Groceries, packing lists and more"
              : `${lists.length} ${lists.length === 1 ? "list" : "lists"}, newest first`}
          </p>
        </div>

        <Link
          href={ADD_LIST_HREF}
          aria-label="New list"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-ink transition-colors hover:bg-lime-soft active:brightness-95"
        >
          <Plus aria-hidden="true" size={19} strokeWidth={2.25} />
        </Link>
      </header>

      {saveError && !editing && (
        <p
          role="alert"
          className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/25"
        >
          {saveError}
        </p>
      )}

      {lists.length === 0 ? (
        <motion.section
          aria-label="No lists"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="surface-card flex flex-col items-start gap-4 p-6"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised text-lime"
          >
            <ListChecks size={24} strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-on-dark">No lists yet</h2>
            <p className="max-w-[48ch] text-sm text-on-dark-muted">
              Create a grocery list or any list you want to keep, on your own
              or shared with your partner.
            </p>
          </div>
          <ButtonLink
            href={ADD_LIST_HREF}
            size="sm"
            leftIcon={<Plus aria-hidden="true" size={16} />}
          >
            New list
          </ButtonLink>
        </motion.section>
      ) : (
        <ul className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {lists.map((list) => (
              <motion.li
                key={list.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={
                  reduce
                    ? undefined
                    : { opacity: 0, scale: 0.95, transition: { duration: 0.16 } }
                }
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              >
                <ListCard
                  list={list}
                  userDisplayName={userName}
                  onOpen={(item) => setOpenId(item.id)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <ListDetailsModal
        list={openList}
        onClose={() => setOpenId(null)}
        onToggleItem={handleToggleItem}
        onEdit={setEditing}
        onDelete={(id) => void handleDelete(id)}
      />

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit List"
        size="lg"
      >
        {editing && (
          <ListForm
            key={editing.id}
            initialValues={listToFormValues(editing)}
            saving={saving}
            error={saveError}
            submitLabel="Save Changes"
            savingLabel="Saving..."
            onSubmit={(values) => void handleSaveEdit(values)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
