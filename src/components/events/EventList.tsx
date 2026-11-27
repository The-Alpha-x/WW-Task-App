"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { Event } from "@/types/event";
import { EventCard } from "./EventCard";

export interface EventListProps {
  events: readonly Event[];
  now: Date;
  userDisplayName?: string | null;
  /** Past list: no featured card, quieter cards. */
  past?: boolean;
  /** Accessible name of the list. */
  label: string;
}

/**
 * Cards for one list. One column on phones, two from `md`. In the upcoming
 * list the first event is the featured lime card and spans the full row.
 * The list staggers its cards in once when it mounts.
 */
export function EventList({
  events,
  now,
  userDisplayName = null,
  past = false,
  label,
}: EventListProps) {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07 } },
  };

  return (
    <motion.ul
      aria-label={label}
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 md:gap-4"
    >
      {events.map((event, index) => {
        const featured = !past && index === 0;
        return (
          <EventCard
            key={event.id}
            event={event}
            now={now}
            userDisplayName={userDisplayName}
            featured={featured}
            past={past}
            className={featured ? "md:col-span-2" : undefined}
          />
        );
      })}
    </motion.ul>
  );
}
