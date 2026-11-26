"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarHeart, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ADD_EVENT_HREF } from "@/lib/navigation";
import { selectUpcomingEvents } from "@/services/events";
import type { Event } from "@/types/event";
import { EventList } from "./EventList";
import { EventNotice } from "./EventNotice";

type EventView = "upcoming" | "past";

export interface EventsOverviewProps {
  /** Every event of the user, earliest first (from the live listener). */
  events: readonly Event[];
  now: Date;
  /** One-off confirmation, e.g. after deleting an event. */
  notice?: string;
  onDismissNotice?: () => void;
}

/**
 * The event list screen: header, Upcoming / Past switch, and the list or an
 * empty state. "Upcoming" uses the service's `selectUpcomingEvents`, so the
 * rule (later day, or today at/after the current minute) exists once. Past is
 * everything else, most recent first, so a finished event can still be opened
 * to edit or delete it.
 */
export function EventsOverview({
  events,
  now,
  notice,
  onDismissNotice,
}: EventsOverviewProps) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<EventView>("upcoming");

  const upcoming = selectUpcomingEvents(events, now);
  const upcomingIds = new Set(upcoming.map((event) => event.id));
  const past = events.filter((event) => !upcomingIds.has(event.id)).reverse();

  const visible = view === "upcoming" ? upcoming : past;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold text-on-dark">Events</h1>
          <p className="text-sm font-medium text-on-dark-muted">
            {upcoming.length === 0
              ? "Nothing planned yet"
              : `${upcoming.length} upcoming ${upcoming.length === 1 ? "event" : "events"}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ButtonLink
            href={ADD_EVENT_HREF}
            size="sm"
            leftIcon={<Plus aria-hidden="true" size={18} />}
          >
            Add event
          </ButtonLink>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {notice && (
          <EventNotice variant="success" onDismiss={onDismissNotice}>
            {notice}
          </EventNotice>
        )}
      </AnimatePresence>

      <div role="group" aria-label="Choose which events to show" className="flex flex-wrap gap-2">
        {(
          [
            { value: "upcoming", label: "Upcoming", count: upcoming.length },
            { value: "past", label: "Past", count: past.length },
          ] as const
        ).map((option) => {
          const selected = option.value === view;
          return (
            <Button
              key={option.value}
              size="sm"
              variant={selected ? "primary" : "ghost"}
              aria-pressed={selected}
              onClick={() => setView(option.value)}
            >
              {option.label}
              <span className="font-medium">{option.count}</span>
            </Button>
          );
        })}
      </div>

      {visible.length > 0 ? (
        // Re-keyed per view so the stagger plays again when the person switches.
        <EventList
          key={view}
          events={visible}
          now={now}
          past={view === "past"}
          label={view === "upcoming" ? "Upcoming events" : "Past events"}
        />
      ) : (
        <motion.section
          key={`empty-${view}`}
          aria-label={view === "upcoming" ? "No upcoming events" : "No past events"}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start gap-5 rounded-2xl bg-surface p-6 md:p-8"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-background text-lime"
          >
            <CalendarHeart size={30} strokeWidth={1.75} />
          </span>
          {view === "upcoming" ? (
            <>
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-on-dark">
                  {events.length === 0 ? "No events yet" : "Nothing coming up"}
                </h2>
                <p className="max-w-[40ch] text-base text-on-dark-muted">
                  Add dinners, trips and special dates so you always know what
                  is next.
                </p>
              </div>
              <ButtonLink
                href={ADD_EVENT_HREF}
                leftIcon={<Plus aria-hidden="true" size={18} />}
              >
                Add an event
              </ButtonLink>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-on-dark">No past events</h2>
              <p className="max-w-[40ch] text-base text-on-dark-muted">
                Events move here once their date and time have passed.
              </p>
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
}
