"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ArrowLeft, CalendarDays, Clock3, Pencil, Trash2, User, Users } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { NotificationButton } from "@/components/ui/NotificationButton";
import { useAction } from "@/hooks/useAction";
import {
  eventToFormValues,
  getMinEventDate,
  type EventFormSubmission,
} from "@/lib/events/form";
import {
  formatEventDate,
  formatEventTime,
  formatEventTimestamp,
  getEventTypeBadgeVariant,
  getEventTypeLabel,
  getRelativeDayLabel,
} from "@/lib/events/display";
import { EVENTS_HREF } from "@/lib/navigation";
import { deleteEvent, updateEvent } from "@/services/events";
import type { Event } from "@/types/event";
import { EventForm } from "./EventForm";
import { EventNotice } from "./EventNotice";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const NOTICE_MS = 5000;

export interface EventDetailsProps {
  /** Live event from the snapshot listener; it is the only copy of the event. */
  event: Event;
  userId: string;
  now: Date;
  /**
   * Called just before a delete starts / if it fails. The parent keeps this
   * view mounted while the live list briefly no longer contains the event.
   */
  onDeleteStart: (event: Event) => void;
  onDeleteEnd: () => void;
}

/**
 * Event details, with edit (in place, through `updateEvent`) and delete
 * (confirmation dialog, then `deleteEvent`). Mirrors the task details frame:
 * round back button, centred title, notification button.
 */
export function EventDetails({
  event,
  userId,
  now,
  onDeleteStart,
  onDeleteEnd,
}: EventDetailsProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [notice, setNotice] = useState("");
  const save = useAction("Could not save your changes.");
  const remove = useAction("Could not delete this event.");

  // The "changes saved" message goes away by itself.
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(""), NOTICE_MS);
    return () => window.clearTimeout(id);
  }, [notice]);

  const relative = getRelativeDayLabel(event.date, now);
  const TypeIcon = event.type === "shared" ? Users : User;
  const today = getMinEventDate(now);

  const startEditing = () => {
    setNotice("");
    setEditing(true);
  };
  const stopEditing = () => setEditing(false);

  const handleSave = async (values: EventFormSubmission) => {
    const saved = await save.run(() => updateEvent(userId, event.id, values));
    if (saved) {
      setEditing(false);
      setNotice("Changes saved.");
    }
  };

  const handleDelete = async () => {
    onDeleteStart(event);
    const deleted = await remove.run(() => deleteEvent(userId, event.id));
    if (deleted) {
      router.replace(`${EVENTS_HREF}?notice=deleted`);
    } else {
      onDeleteEnd();
    }
  };

  const closeDeleteDialog = () => {
    if (remove.pending) return;
    setConfirmingDelete(false);
  };

  const backButtonClasses =
    "inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-on-dark transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime";

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08 } },
  };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.2 : 0.45, ease: EASE_OUT },
    },
  };

  return (
    <PageContainer className="flex min-h-[calc(100dvh-7rem)] flex-col gap-6 md:min-h-screen md:py-10">
      <header className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3">
        {editing ? (
          <button
            type="button"
            aria-label="Back to event details"
            onClick={stopEditing}
            disabled={save.pending}
            className={backButtonClasses}
          >
            <ArrowLeft aria-hidden="true" size={22} />
          </button>
        ) : (
          <Link href={EVENTS_HREF} aria-label="Back to events" className={backButtonClasses}>
            <ArrowLeft aria-hidden="true" size={22} />
          </Link>
        )}
        <h1 className="text-center text-lg font-semibold text-on-dark">
          {editing ? "Edit Event" : "Event Details"}
        </h1>
        <NotificationButton className="h-12 w-12" />
      </header>

      <AnimatePresence initial={false}>
        {notice && !editing && (
          <EventNotice variant="success" onDismiss={() => setNotice("")}>
            {notice}
          </EventNotice>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.3, ease: EASE_OUT }}
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
              onCancel={stopEditing}
            />
          </motion.div>
        ) : (
          <motion.div
            key="view"
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="flex flex-col gap-6"
          >
            <motion.section
              variants={item}
              aria-labelledby="event-title"
              className="flex flex-col gap-5"
            >
              <h2
                id="event-title"
                className="break-words text-3xl font-bold leading-tight text-on-dark"
              >
                {event.title}
              </h2>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-on-dark-muted">
                <p className="inline-flex items-center gap-2">
                  <CalendarDays aria-hidden="true" size={18} className="text-lime" />
                  <span>
                    <span className="text-on-dark">Date:</span> {formatEventDate(event.date)}
                  </span>
                </p>
                <p className="inline-flex items-center gap-2">
                  <Clock3 aria-hidden="true" size={18} className="text-lime" />
                  <span>
                    <span className="text-on-dark">Time:</span> {formatEventTime(event.time)}
                  </span>
                </p>
                <p className="inline-flex items-center gap-2">
                  <TypeIcon aria-hidden="true" size={18} className="text-lime" />
                  <span>
                    <span className="text-on-dark">Type:</span>{" "}
                    {getEventTypeLabel(event.type)}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {relative && <Badge variant="lime">{relative}</Badge>}
                <Badge variant={getEventTypeBadgeVariant(event.type)}>
                  <TypeIcon aria-hidden="true" size={14} />
                  {getEventTypeLabel(event.type)}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Pencil aria-hidden="true" size={17} />}
                  onClick={startEditing}
                >
                  Edit event
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Trash2 aria-hidden="true" size={17} />}
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete event
                </Button>
              </div>
            </motion.section>

            <motion.section
              variants={item}
              aria-labelledby="event-description-heading"
              className="rounded-2xl bg-lime p-5 text-ink md:p-6"
            >
              <h2 id="event-description-heading" className="text-xl font-bold">
                Description
              </h2>
              <p className="mt-3 whitespace-pre-line break-words text-sm font-medium leading-relaxed">
                {event.description || "No description provided."}
              </p>
            </motion.section>

            <motion.section
              variants={item}
              aria-labelledby="event-notes-heading"
              className="rounded-2xl bg-card p-5 text-ink md:p-6"
            >
              <h2 id="event-notes-heading" className="text-xl font-bold">
                Notes
              </h2>
              <p
                className={
                  event.notes
                    ? "mt-3 whitespace-pre-line break-words text-sm font-medium leading-relaxed"
                    : "mt-3 text-sm font-medium text-ink-muted"
                }
              >
                {event.notes || "No notes for this event."}
              </p>
            </motion.section>

            <motion.p variants={item} className="text-xs font-medium text-on-dark-muted">
              Last updated {formatEventTimestamp(event.updatedAt)}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={confirmingDelete}
        onClose={closeDeleteDialog}
        size="sm"
        title="Delete this event?"
        description={`"${event.title}" will be removed. This cannot be undone.`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeDeleteDialog}
              disabled={remove.pending}
            >
              Keep event
            </Button>
            <Button
              variant="danger"
              loading={remove.pending}
              onClick={() => void handleDelete()}
            >
              {remove.pending ? "Deleting..." : "Delete event"}
            </Button>
          </>
        }
      >
        {remove.error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {remove.error}
          </p>
        )}
      </Modal>
    </PageContainer>
  );
}
