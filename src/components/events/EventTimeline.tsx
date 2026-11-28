"use client";

import { ChevronRight, User, Users } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatCompactDate, getLocalDate, getLocalTime } from "@/lib/date-time";
import { formatTimeParts, groupEventsByDate } from "@/lib/events/calendar";
import {
  formatEventWhen,
  getEventAriaLabel,
  getRelativeDayLabel,
} from "@/lib/events/display";
import type { Event } from "@/types/event";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export interface EventTimelineProps {
  events: readonly Event[];
  now: Date;
  userDisplayName?: string | null;
  /** Group events under day headings (used when showing all days in a week or month). */
  showDayHeaders?: boolean;
  label: string;
  onSelectEvent: (event: Event) => void;
}

function isEventPast(event: Event, today: string, nowTime: string): boolean {
  return event.date < today || (event.date === today && event.time <= nowTime);
}

/**
 * Vertical timeline of events with minimalistic monochrome frosted dark glass
 * cards, using purple for shared events and blue for individual events.
 */
export function EventTimeline({
  events,
  now,
  userDisplayName = null,
  showDayHeaders = false,
  label,
  onSelectEvent,
}: EventTimelineProps) {
  const reduce = useReducedMotion();
  const today = getLocalDate(now);
  const nowTime = getLocalTime(now);
  const isWitch = userDisplayName?.trim().toLowerCase() === "witch";

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.05 } },
  };

  const itemVariants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.15 : 0.35, ease: EASE_OUT },
    },
  };

  const renderRow = (event: Event, isNextUp: boolean) => {
    const timeParts = formatTimeParts(event.time);
    const past = isEventPast(event, today, nowTime);
    const relative = getRelativeDayLabel(event.date, now);
    const isShared = event.type === "shared";
    const TypeIcon = isShared ? Users : User;
    const subtitle =
      event.description.trim() || event.notes.trim() || formatEventWhen(event);
    const activeHighlight = isNextUp && !past;

    return (
      <motion.li
        key={event.id}
        variants={itemVariants}
        whileHover={reduce ? undefined : { y: -2 }}
        whileTap={reduce ? undefined : { scale: 0.99 }}
        className="flex items-stretch gap-3 sm:gap-4"
      >
        <div
          aria-hidden="true"
          className="flex w-12 shrink-0 flex-col items-end pt-4 text-right sm:w-14"
        >
          <span className="text-sm font-bold leading-tight text-lime">
            {timeParts.main}
          </span>
          {timeParts.period && (
            <span className="text-2xs font-semibold uppercase tracking-wide text-on-dark-muted">
              {timeParts.period}
            </span>
          )}
        </div>

        <article
          style={{
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            backdropFilter: "blur(20px) saturate(180%)",
          }}
          className={cn(
            "group relative flex min-w-0 flex-1 flex-col gap-3 rounded-xl bg-glass/75 p-4 shadow-glass ring-1 transition-all duration-base ease-standard has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-on-dark sm:p-5",
            activeHighlight
              ? "ring-glass-border/25 hover:bg-surface/75 hover:ring-glass-border/35"
              : "ring-glass-border/10 hover:bg-surface/75 hover:ring-glass-border/20",
            past && "opacity-65",
          )}
        >
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold leading-snug tracking-tight text-on-dark sm:text-lg">
                  <button
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    aria-label={getEventAriaLabel(event)}
                    className="line-clamp-2 text-left after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
                  >
                    {event.title}
                  </button>
                </h3>
                <ChevronRight
                  aria-hidden="true"
                  size={16}
                  className="mt-1 shrink-0 text-on-dark-muted/50 transition-transform duration-base ease-standard group-hover:translate-x-1 group-hover:text-on-dark"
                />
              </div>

              <p className="mt-1 line-clamp-1 text-sm font-medium text-on-dark-muted">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {past ? (
                <span className="inline-flex items-center rounded-full bg-surface px-3 py-1 text-2xs font-semibold text-on-dark-muted">
                  Completed
                </span>
              ) : isNextUp ? (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-lime ring-1 ring-lime/50">
                  {relative ? `Next · ${relative}` : "Next up"}
                </span>
              ) : relative ? (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-on-dark-muted/25 text-on-dark-muted">
                  {relative}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-surface px-3 py-1 text-2xs font-semibold text-on-dark-muted">
                  Scheduled
                </span>
              )}
            </div>

            {isShared ? (
              <span className="flex items-center gap-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1 py-1 text-2xs font-semibold ring-1 bg-pink/15 text-pink ring-pink/25",
                  )}
                >
                  {" "}
                  <TypeIcon aria-hidden="true" size={11} />
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1 py-1 text-2xs font-semibold ring-1 bg-blue/15 text-blue ring-blue/25",
                  )}
                >
                  {" "}
                  <TypeIcon aria-hidden="true" size={11} />
                </span>
              </span>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1 py-1 text-2xs font-semibold ring-1",
                  isWitch
                    ? "bg-pink/15 text-pink ring-pink/25"
                    : "bg-blue/15 text-blue ring-blue/25",
                )}
              >
                <TypeIcon aria-hidden="true" size={11} />
              </span>
            )}
          </div>
        </article>
      </motion.li>
    );
  };

  const firstUpcomingId = events.find(
    (event) => !isEventPast(event, today, nowTime),
  )?.id;

  if (!showDayHeaders) {
    return (
      <motion.ul
        aria-label={label}
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3"
      >
        {events.map((event) => renderRow(event, event.id === firstUpcomingId))}
      </motion.ul>
    );
  }

  const grouped = Array.from(groupEventsByDate(events).entries());

  return (
    <motion.div
      aria-label={label}
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      {grouped.map(([date, dayEvents]) => {
        const relative = getRelativeDayLabel(date, now);
        return (
          <section key={date} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 border-b border-glass-border/10 pb-2">
              <h3 className="text-sm font-bold text-on-dark">
                {formatCompactDate(date)}
                {relative && (
                  <span className="ml-2 text-xs font-semibold text-on-dark-muted">
                    · {relative}
                  </span>
                )}
              </h3>
              <span className="text-xs font-medium text-on-dark-muted">
                {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
              </span>
            </div>
            <ul className="flex flex-col gap-3">
              {dayEvents.map((event) =>
                renderRow(event, event.id === firstUpcomingId),
              )}
            </ul>
          </section>
        );
      })}
    </motion.div>
  );
}
