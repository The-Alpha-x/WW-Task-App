"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarClock, Clock, MapPin } from "lucide-react";
import { ParticipantBadges } from "@/components/ui/ParticipantBadges";
import { formatCompactDate, formatTime, getLocalDate } from "@/lib/date-time";
import { selectUpcomingEvents } from "@/services/events";
import type { Event } from "@/types/event";

export interface EventCountdownProps {
  events: readonly Event[];
  /** Current moment, updated every second from the parent. */
  now: Date;
  userDisplayName?: string | null;
}

interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

function getCountdown(targetMs: number, nowMs: number): CountdownParts {
  const diff = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function getEventTimestamp(event: Event): number {
  const [y = 2026, m = 1, d = 1] = event.date.split("-").map(Number);
  const [hours = 0, minutes = 0] = event.time.split(":").map(Number);
  return new Date(y, m - 1, d, hours, minutes, 0, 0).getTime();
}

function CountdownDigits({ parts }: { parts: CountdownParts }) {
  const segments = [
    { value: parts.days, label: "Days" },
    { value: parts.hours, label: "Hrs" },
    { value: parts.minutes, label: "Min" },
    { value: parts.seconds, label: "Sec" },
  ] as const;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-baseline gap-1 sm:gap-2">
      {segments.map((seg, i) => (
        <div key={seg.label} className="contents">
          {i > 0 && (
            <span
              aria-hidden="true"
              className="text-center font-display text-3xl font-bold text-on-dark-muted sm:text-4xl"
            >
              :
            </span>
          )}
          <div className="flex flex-col items-center">
            <span className="font-display text-[3rem] font-extrabold leading-none tabular-nums text-on-dark sm:text-[3.25rem] md:text-stat">
              {seg.value}
            </span>
            <span className="mt-2 text-2xs font-semibold uppercase tracking-wider text-on-dark-muted">
              {seg.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Highlights the next upcoming event with a live DD:HH:MM:SS countdown,
 * and shows the following event ("Next Up") with its scheduled time.
 */
export function EventCountdown({
  events,
  now,
  userDisplayName = null,
}: EventCountdownProps) {
  const reduce = useReducedMotion();
  const today = getLocalDate(now);

  const { primaryEvent, nextUpEvent } = useMemo(() => {
    const upcoming = selectUpcomingEvents(events, now);
    return {
      primaryEvent: upcoming[0] ?? null,
      nextUpEvent: upcoming[1] ?? null,
    };
  }, [events, now]);

  if (!primaryEvent) {
    return (
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
        aria-label="No upcoming events"
        className="rounded-lg bg-surface/60 p-6 shadow-card ring-1 ring-glass-border/10"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CalendarClock
              aria-hidden="true"
              size={20}
              className="shrink-0 text-on-dark-muted"
            />
            <p className="text-base font-medium text-on-dark-muted">
              No upcoming events scheduled
            </p>
          </div>
          <Link
            href="/events"
            className="shrink-0 text-sm font-semibold text-lime hover:text-on-dark"
          >
            Events
          </Link>
        </div>
      </motion.section>
    );
  }

  const countdown = getCountdown(
    getEventTimestamp(primaryEvent),
    now.getTime(),
  );
  const isToday = primaryEvent.date === today;

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3 }}
      aria-label="Next event countdown"
      className="flex flex-col gap-4"
    >
      <h2 className="type-h2 text-on-dark">Upcoming Events</h2>
      {/* Primary upcoming event with DD:HH:MM:SS countdown */}
      <Link
        href={`/events?event=${encodeURIComponent(primaryEvent.id)}`}
        className="group block rounded-lg bg-surface/80 p-6 shadow-card ring-1 ring-glass-border/10 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-7"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock aria-hidden="true" size={15} className="text-lime" />
            <span className="text-2xs font-semibold uppercase tracking-wider text-lime">
              Next Event In
            </span>
          </div>
          <span className="rounded-full bg-surface-raised px-3 py-1 text-xs font-semibold tabular-nums text-on-dark-muted">
            {isToday
              ? `Today at ${formatTime(primaryEvent.time)}`
              : `${formatCompactDate(primaryEvent.date)} at ${formatTime(primaryEvent.time)}`}
          </span>
        </div>

        <CountdownDigits parts={countdown} />

        <div className="mt-6 flex items-end justify-between gap-3 border-t border-glass-border/10 pt-4">
          <div className="min-w-0 flex-1">
            <h3 className="type-h3 truncate text-on-dark transition-colors group-hover:text-lime">
              {primaryEvent.title}
            </h3>
            {primaryEvent.location && (
              <p className="mt-2 flex items-center gap-2 truncate text-sm font-medium text-on-dark-muted">
                <MapPin
                  aria-hidden="true"
                  size={14}
                  className="shrink-0 text-blue"
                />
                <span className="truncate">{primaryEvent.location}</span>
              </p>
            )}
            {primaryEvent.description && (
              <p className="mt-2 truncate text-sm text-on-dark-muted">
                {primaryEvent.description}
              </p>
            )}
          </div>
          <ParticipantBadges
            type={primaryEvent.type}
            userDisplayName={userDisplayName}
            className="shrink-0"
          />
        </div>
      </Link>

      {/* Next-up event (time only, no countdown) */}
      {nextUpEvent && (
        <Link
          href={`/events?event=${encodeURIComponent(nextUpEvent.id)}`}
          className="flex items-center justify-between gap-4 rounded-lg bg-surface/60 px-5 py-4 shadow-card ring-1 ring-glass-border/10 transition-colors hover:bg-surface/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 text-2xs font-semibold uppercase tracking-wider text-on-dark-muted">
              Next Up
            </span>
            <h4 className="truncate text-base font-semibold text-on-dark">
              {nextUpEvent.title}
            </h4>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ParticipantBadges
              type={nextUpEvent.type}
              userDisplayName={userDisplayName}
            />
            <span className="rounded-full bg-surface-raised px-3 py-1 text-xs font-semibold tabular-nums text-on-dark-muted">
              {nextUpEvent.date === today
                ? `at ${formatTime(nextUpEvent.time)}`
                : `${formatCompactDate(nextUpEvent.date)} at ${formatTime(nextUpEvent.time)}`}
            </span>
          </div>
        </Link>
      )}
    </motion.section>
  );
}
