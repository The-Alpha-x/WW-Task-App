"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EVENTS_HREF, getEventHref } from "@/lib/navigation";
import {
  formatEventDate,
  formatEventTime,
  getEventTypeLabel,
} from "@/lib/events/display";
import type { Event } from "@/types/event";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export interface EventSavedPanelProps {
  event: Event;
  /** Clears the form so another event can be added. */
  onAddAnother: () => void;
}

/**
 * Success feedback after creating an event: a lime sheet with a check that
 * draws itself, a summary of what was saved, and the next steps. This is the
 * single orchestrated moment of the create flow.
 */
export function EventSavedPanel({ event, onAddAnother }: EventSavedPanelProps) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      role="status"
      aria-labelledby="event-saved-heading"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduce ? 0.2 : 0.5, ease: EASE_OUT }}
      className="flex flex-col gap-6 rounded-2xl bg-lime p-6 text-ink md:p-8"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-ink text-lime"
      >
        <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8">
          <motion.path
            d="M7 17 l6 6 12-13"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.25, ease: EASE_OUT }}
          />
        </svg>
      </span>

      <div className="flex flex-col gap-2">
        <h2 id="event-saved-heading" className="text-3xl font-bold leading-tight">
          Event saved
        </h2>
        <p className="text-base font-semibold">{event.title}</p>
      </div>

      <dl className="flex flex-col gap-2 text-sm font-semibold">
        <div className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" size={18} />
          <dt className="sr-only">Date</dt>
          <dd>{formatEventDate(event.date)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 aria-hidden="true" size={18} />
          <dt className="sr-only">Time</dt>
          <dd>
            {formatEventTime(event.time)}, {getEventTypeLabel(event.type).toLowerCase()}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3 md:flex-row">
        <ButtonLink
          href={getEventHref(event.id)}
          variant="dark"
          size="lg"
          className="md:flex-1"
        >
          View event
        </ButtonLink>
        <Button
          variant="secondary"
          size="lg"
          className="md:flex-1"
          onClick={onAddAnother}
        >
          Add another
        </Button>
        <ButtonLink
          href={EVENTS_HREF}
          variant="secondary"
          size="lg"
          className="md:flex-1"
        >
          All events
        </ButtonLink>
      </div>
    </motion.section>
  );
}
