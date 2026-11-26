"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
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
  formatEventDate,
  formatEventTime,
  formatEventTimestamp,
  formatEventWhen,
  getEventTypeLabel,
  getRelativeDayLabel,
} from "@/lib/events/display";
import {
  eventToFormValues,
  getMinEventDate,
  type EventFormSubmission,
} from "@/lib/events/form";
import { deleteEvent, updateEvent } from "@/services/events";
import type { Event } from "@/types/event";
import { EventForm } from "./EventForm";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export interface EventDetailsModalProps {
  event: Event | null;
  open: boolean;
  userId: string;
  now: Date;
  onClose: () => void;
}

/**
 * Glassy modal for viewing, editing, and deleting a single event in place
 * on `/events`, using the Apple-style dark glass `Modal` and `Toaster`.
 */
export function EventDetailsModal({
  event,
  open,
  userId,
  now,
  onClose,
}: EventDetailsModalProps) {
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const save = useAction("Could not save your changes.");
  const remove = useAction("Could not delete this event.");

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setConfirmingDelete(false);
    }
  }, [open, event?.id]);

  if (!event) return null;

  const relative = getRelativeDayLabel(event.date, now);
  const TypeIcon = event.type === "shared" ? Users : User;
  const today = getMinEventDate(now);

  const handleClose = () => {
    if (save.pending || remove.pending) return;
    onClose();
  };

  const handleSave = async (values: EventFormSubmission) => {
    const ok = await save.run(() => updateEvent(userId, event.id, values));
    if (ok) {
      setEditing(false);
      toast.success(
        "Event updated",
        `${values.title} · ${formatEventWhen(values)}`,
      );
    } else {
      toast.error(
        "Could not update event",
        "Please check your details and try again.",
      );
    }
  };

  const handleDelete = async () => {
    const deletedTitle = event.title;
    const ok = await remove.run(() => deleteEvent(userId, event.id));
    if (ok) {
      setConfirmingDelete(false);
      onClose();
      toast.success("Event deleted", deletedTitle);
    } else {
      toast.error("Could not delete event", "Please try again.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size={editing ? "lg" : "md"}
      title={editing ? "Edit Event" : event.title}
      description={
        editing
          ? "Update the details, schedule, or notes for this event."
          : `${formatEventDate(event.date)} · ${formatEventTime(event.time)}`
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
              Edit event
            </Button>
          </>
        ) : undefined
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.25, ease: EASE_OUT }}
          >
            <EventForm
              initialValues={eventToFormValues(event)}
              original={{ date: event.date, time: event.time }}
              minDate={event.date < today ? event.date : today}
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
            className="flex flex-col gap-4 rounded-xl"
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-danger">
                Delete this event?
              </h3>
              <p className="text-sm text-on-dark-muted">
                &ldquo;{event.title}&rdquo; will be permanently removed. This
                cannot be undone.
              </p>
            </div>

            {remove.error && (
              <p role="alert" className="text-sm font-semibold text-danger">
                {remove.error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                size="sm"
                variant="secondary"
                disabled={remove.pending}
                onClick={() => setConfirmingDelete(false)}
              >
                Keep event
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={remove.pending}
                onClick={() => void handleDelete()}
              >
                {remove.pending ? "Deleting..." : "Delete event"}
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
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-card ring-1 ring-lime/25">
                <TypeIcon aria-hidden="true" size={12} />
                {getEventTypeLabel(event.type)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-background/45 px-4 py-3 text-sm font-medium text-on-dark-muted ring-1 ring-glass-border/10">
              <span className="inline-flex items-center gap-2">
                <CalendarDays
                  aria-hidden="true"
                  size={16}
                  className="text-blue"
                />
                <span className="text-on-dark">
                  {formatEventDate(event.date)}
                </span>
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 aria-hidden="true" size={16} className="text-blue" />
                <span className="text-on-dark">
                  {formatEventTime(event.time)}
                </span>
              </span>
            </div>

            <section
              aria-label="Description"
              className="rounded-xl bg-background/45 p-4 ring-1 ring-glass-border/10"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-on-dark-muted/70">
                Description
              </h3>
              <p className="mt-2 whitespace-pre-line break-words text-sm font-medium leading-relaxed text-on-dark">
                {event.description || "No description provided."}
              </p>
            </section>

            <section
              aria-label="Notes"
              className="rounded-xl bg-background/45 p-4 ring-1 ring-glass-border/10"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-on-dark-muted/70">
                Notes
              </h3>
              <p className="mt-2 whitespace-pre-line break-words text-sm font-medium leading-relaxed text-on-dark">
                {event.notes || "No notes for this event."}
              </p>
            </section>

            <p className="text-xs font-medium text-on-dark-muted">
              Last updated {formatEventTimestamp(event.updatedAt)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
