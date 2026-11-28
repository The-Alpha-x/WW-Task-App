"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Heart,
  MapPin,
  Pencil,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toaster";
import { useAction } from "@/hooks/useAction";
import {
  formatMemoryDate,
  formatMemoryTime,
  formatMemoryTimestamp,
  formatMemoryWhen,
  getMemoryTypeLabel,
  getRelativeDayLabel,
} from "@/lib/memories/display";
import {
  memoryToFormValues,
  getMaxMemoryDate,
  type MemoryFormValues,
} from "@/lib/memories/form";
import { updateMemory, deleteMemory } from "@/services/memories";
import type { Memory } from "@/types/memory";
import { MemoryForm } from "./MemoryForm";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export interface MemoryDetailsModalProps {
  memory: Memory | null;
  open: boolean;
  userId: string;
  now: Date;
  onClose: () => void;
}

/**
 * Glassy modal for viewing, editing, and deleting a single memory, matching
 * the EventDetailsModal pattern: view → edit → delete confirm.
 */
export function MemoryDetailsModal({
  memory,
  open,
  userId,
  now,
  onClose,
}: MemoryDetailsModalProps) {
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const save = useAction("Could not save your changes.");
  const remove = useAction("Could not delete this memory.");

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setConfirmingDelete(false);
    }
  }, [open, memory?.id]);

  if (!memory) return null;

  const relative = getRelativeDayLabel(memory.date, now);
  const TypeIcon = memory.type === "shared" ? Users : User;
  const maxDate = getMaxMemoryDate(now);

  const handleClose = () => {
    if (save.pending || remove.pending) return;
    onClose();
  };

  const handleSave = async (values: MemoryFormValues) => {
    const payload: MemoryFormValues = {
      ...values,
      time: values.time ?? "",
      type: "shared",
    };
    const ok = await save.run(() => updateMemory(userId, memory.id, payload));
    if (ok) {
      setEditing(false);
      toast.success(
        "Memory updated",
        `${payload.title} · ${formatMemoryWhen({ date: payload.date, time: payload.time || null })}`,
      );
    } else {
      toast.error(
        "Could not update memory",
        "Please check your details and try again.",
      );
    }
  };

  const handleDelete = async () => {
    const deletedTitle = memory.title;
    const ok = await remove.run(() => deleteMemory(userId, memory.id));
    if (ok) {
      setConfirmingDelete(false);
      onClose();
      toast.success("Memory deleted", deletedTitle);
    } else {
      toast.error("Could not delete memory", "Please try again.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size={editing ? "lg" : "md"}
      title={editing ? "Edit Memory" : memory.title}
      description={
        editing
          ? "Update the details, date, or notes for this memory."
          : `${formatMemoryDate(memory.date)}${memory.time ? ` · ${formatMemoryTime(memory.time)}` : ""}`
      }
      footer={
        !editing && !confirmingDelete ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Trash2 aria-hidden="true" size={16} />}
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </Button>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Pencil aria-hidden="true" size={16} />}
              onClick={() => setEditing(true)}
            >
              Edit memory
            </Button>
          </>
        ) : undefined
      }
    >
      <AnimatePresence initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.22, ease: EASE_OUT }}
          >
            <MemoryForm
              initialValues={memoryToFormValues(memory)}
              original={{ date: memory.date, time: memory.time }}
              maxDate={memory.date > maxDate ? memory.date : maxDate}
              saving={save.pending}
              error={save.error}
              submitLabel="Save changes"
              savingLabel="Saving..."
              onSubmit={(values) => void handleSave(values)}
              onCancel={() => setEditing(false)}
            />
          </motion.div>
        ) : confirmingDelete ? (
          <motion.div
            key="confirm-delete"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.25, ease: EASE_OUT }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <h3 className="type-h3 text-danger">
                Delete this memory?
              </h3>
              <p className="type-body text-on-dark-muted">
                &ldquo;{memory.title}&rdquo; will be permanently removed. This
                cannot be undone.
              </p>
            </div>

            {remove.error && (
              <p role="alert" className="form-alert">
                {remove.error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={remove.pending}
                onClick={() => setConfirmingDelete(false)}
              >
                Keep memory
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={remove.pending}
                onClick={() => void handleDelete()}
              >
                {remove.pending ? "Deleting..." : "Delete memory"}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.25, ease: EASE_OUT }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              {relative && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-lime ring-1 ring-lime/25">
                  {relative}
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-on-dark ring-1 ring-glass-border/20">
                <TypeIcon aria-hidden="true" size={12} />
                {getMemoryTypeLabel(memory.type)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-pink/10 px-3 py-1 text-xs font-semibold text-pink ring-1 ring-pink/25">
                <Heart aria-hidden="true" size={12} />
                Memory
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-background/45 px-4 py-3 text-sm font-medium text-on-dark-muted ring-1 ring-glass-border/10">
              <span className="inline-flex items-center gap-2">
                <CalendarDays
                  aria-hidden="true"
                  size={16}
                  className="text-blue"
                />
                <span className="text-on-dark">
                  {formatMemoryDate(memory.date)}
                </span>
              </span>
              {memory.time && (
                <span className="inline-flex items-center gap-2">
                  <Clock3 aria-hidden="true" size={16} className="text-blue" />
                  <span className="text-on-dark">
                    {formatMemoryTime(memory.time)}
                  </span>
                </span>
              )}
              {memory.location && (
                <span className="inline-flex min-w-0 items-center gap-2">
                  <MapPin
                    aria-hidden="true"
                    size={16}
                    className="shrink-0 text-lime"
                  />
                  <span className="break-words text-on-dark">
                    {memory.location}
                  </span>
                </span>
              )}
            </div>

            <section
              aria-label="Description"
              className="rounded-lg bg-background/45 p-5 ring-1 ring-glass-border/10"
            >
              <h3 className="form-section__title">
                Description
              </h3>
              <p className="mt-3 whitespace-pre-line break-words text-base font-medium leading-relaxed text-on-dark">
                {memory.description || "No description provided."}
              </p>
            </section>

            <section
              aria-label="Notes"
              className="rounded-lg bg-background/45 p-5 ring-1 ring-glass-border/10"
            >
              <h3 className="form-section__title">
                Notes
              </h3>
              <p className="mt-3 whitespace-pre-line break-words text-base font-medium leading-relaxed text-on-dark">
                {memory.notes || "No notes for this memory."}
              </p>
            </section>

            <p className="type-caption text-on-dark-muted">
              Last updated {formatMemoryTimestamp(memory.updatedAt)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
