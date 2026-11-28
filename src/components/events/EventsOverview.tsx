"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCompactDate, getLocalDate } from "@/lib/date-time";
import {
  filterEventsFromCurrentMonth,
  getMonthCalendarGrid,
  getScrollableWeeks,
  groupEventsByDate,
} from "@/lib/events/calendar";
import { ADD_EVENT_HREF } from "@/lib/navigation";
import type { Event } from "@/types/event";
import { EventDetailsModal } from "./EventDetailsModal";
import { EventNotice } from "./EventNotice";
import { EventTimeline } from "./EventTimeline";

type CalendarView = "week" | "month";

const WEEKDAY_HEADERS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export interface EventsOverviewProps {
  /** Every event of the user, earliest first (from the live listener). */
  events: readonly Event[];
  userId: string;
  userDisplayName?: string | null;
  now: Date;
  /** Optional deep-linked event ID (`?event=<id>`) to open in the modal. */
  initialEventId?: string | null;
  onClearInitialEvent?: () => void;
  /** One-off confirmation, e.g. after deleting an event. */
  notice?: string;
  onDismissNotice?: () => void;
}

/**
 * Events overview: Week / Month calendar tabs, horizontally scrollable weeks
 * in Week view, next-month navigation in Month view (excluding events before
 * this month), a vertically scrolling timeline, and a glassy details modal.
 */
export function EventsOverview({
  events,
  userId,
  userDisplayName = null,
  now,
  initialEventId = null,
  onClearInitialEvent,
  notice,
  onDismissNotice,
}: EventsOverviewProps) {
  const reduce = useReducedMotion();
  const today = getLocalDate(now);
  const currentMonthStart = useMemo(
    () => getLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    [now],
  );

  const [view, setView] = useState<CalendarView>("week");
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [monthOffset, setMonthOffset] = useState(0);
  const [modalEventId, setModalEventId] = useState<string | null>(
    initialEventId,
  );

  useEffect(() => {
    if (initialEventId) setModalEventId(initialEventId);
  }, [initialEventId]);

  const modalEvent = useMemo(
    () =>
      modalEventId
        ? (events.find((item) => item.id === modalEventId) ?? null)
        : null,
    [events, modalEventId],
  );

  const closeModal = () => {
    setModalEventId(null);
    if (initialEventId) onClearInitialEvent?.();
  };

  const { weeks, currentWeekIndex } = useMemo(
    () => getScrollableWeeks(now, 12),
    [now],
  );
  const [activeWeekIndex, setActiveWeekIndex] = useState(currentWeekIndex);
  const weekScrollerRef = useRef<HTMLDivElement>(null);

  const monthGrid = useMemo(
    () => getMonthCalendarGrid(now, monthOffset),
    [now, monthOffset],
  );

  // Never show events before the start of the current month.
  const currentMonthOnwards = useMemo(
    () => filterEventsFromCurrentMonth(events, now),
    [events, now],
  );

  const eventsByDate = useMemo(
    () => groupEventsByDate(currentMonthOnwards),
    [currentMonthOnwards],
  );

  // Position the horizontal week scroller at the active week when Week view mounts.
  useEffect(() => {
    if (view !== "week") return;
    const el = weekScrollerRef.current;
    if (!el) return;
    el.scrollTo({
      left: activeWeekIndex * el.clientWidth,
      behavior: "instant" as ScrollBehavior,
    });
    // Only snap into position when switching to Week view or on initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const scrollToWeek = (index: number) => {
    const clamped = Math.max(0, Math.min(weeks.length - 1, index));
    setActiveWeekIndex(clamped);
    const el = weekScrollerRef.current;
    if (el) {
      el.scrollTo({
        left: clamped * el.clientWidth,
        behavior: reduce ? "instant" : "smooth",
      });
    }
  };

  const handleWeekScroll = () => {
    const el = weekScrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const nextIndex = Math.round(el.scrollLeft / el.clientWidth);
    if (
      nextIndex !== activeWeekIndex &&
      nextIndex >= 0 &&
      nextIndex < weeks.length
    ) {
      setActiveWeekIndex(nextIndex);
    }
  };

  const activeWeek = weeks[activeWeekIndex] ?? weeks[currentWeekIndex];
  const weekStart = activeWeek?.weekStart ?? monthGrid.monthStart;
  const weekEnd = activeWeek?.weekEnd ?? monthGrid.monthEnd;

  const weekEvents = useMemo(
    () =>
      currentMonthOnwards.filter(
        (event) => event.date >= weekStart && event.date <= weekEnd,
      ),
    [currentMonthOnwards, weekStart, weekEnd],
  );

  const monthEvents = useMemo(
    () =>
      currentMonthOnwards.filter(
        (event) =>
          event.date >= monthGrid.monthStart &&
          event.date <= monthGrid.monthEnd,
      ),
    [currentMonthOnwards, monthGrid.monthStart, monthGrid.monthEnd],
  );

  const periodEvents = view === "week" ? weekEvents : monthEvents;

  const activeSelectedDate = useMemo(() => {
    if (!selectedDate) return null;
    if (view === "week") {
      return activeWeek?.days.some((day) => day.date === selectedDate)
        ? selectedDate
        : null;
    }
    return selectedDate >= monthGrid.monthStart &&
      selectedDate <= monthGrid.monthEnd
      ? selectedDate
      : null;
  }, [
    selectedDate,
    view,
    activeWeek,
    monthGrid.monthStart,
    monthGrid.monthEnd,
  ]);

  const visibleEvents = useMemo(() => {
    if (!activeSelectedDate) return periodEvents;
    return eventsByDate.get(activeSelectedDate) ?? [];
  }, [activeSelectedDate, periodEvents, eventsByDate]);

  const handleTabChange = (nextView: CalendarView) => {
    setView(nextView);
    if (nextView === "month") {
      setSelectedDate((current) => {
        if (current === null) return null;
        return current >= monthGrid.monthStart && current <= monthGrid.monthEnd
          ? current
          : monthOffset === 0
            ? today
            : null;
      });
    } else {
      setSelectedDate((current) => {
        if (current === null) return null;
        return activeWeek?.days.some((d) => d.date === current)
          ? current
          : today;
      });
    }
  };

  const handleMonthChange = (nextOffset: number) => {
    const clamped = Math.max(0, nextOffset);
    setMonthOffset(clamped);
    setSelectedDate(clamped === 0 ? today : null);
  };

  const headerMonthLabel =
    view === "week"
      ? (activeWeek?.monthLabel ?? monthGrid.monthLabel)
      : monthGrid.monthLabel;

  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      {/* Header matching the reference and other pages' full width */}
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="type-display-lg text-on-dark">Events</h1>
          <p className="type-body text-on-dark-muted">
            {currentMonthOnwards.length === 0
              ? "Nothing planned from this month onwards"
              : `${currentMonthOnwards.length} ${currentMonthOnwards.length === 1 ? "event" : "events"} from this month onwards`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-xs font-semibold text-on-dark ring-1 ring-glass-border/10 sm:text-sm">
            <Calendar aria-hidden="true" size={15} className="text-lime" />
            <span>{headerMonthLabel}</span>
          </span>

          <Link
            href={ADD_EVENT_HREF}
            aria-label="Add event"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-ink transition-colors hover:bg-lime-soft active:brightness-95"
          >
            <CalendarPlus aria-hidden="true" size={19} strokeWidth={2} />
          </Link>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {notice && (
          <EventNotice variant="success" onDismiss={onDismissNotice}>
            {notice}
          </EventNotice>
        )}
      </AnimatePresence>

      {/* Week / Month switcher tabs + All-period toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Calendar view"
          className="inline-flex rounded-full bg-surface p-1 ring-1 ring-glass-border/10"
        >
          {(
            [
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ] as const
          ).map((tab) => {
            const selected = tab.value === view;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-base ease-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  selected
                    ? "bg-lime text-ink"
                    : "text-on-dark-muted hover:text-on-dark",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() =>
            setSelectedDate(activeSelectedDate === null ? today : null)
          }
          aria-pressed={activeSelectedDate === null}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-colors duration-base ease-standard",
            activeSelectedDate === null
              ? "bg-lime/10 text-lime ring-lime/40"
              : "bg-surface text-on-dark-muted ring-glass-border/10 hover:bg-surface-raised hover:text-on-dark",
          )}
        >
          {view === "week"
            ? `All this week (${weekEvents.length})`
            : `All ${monthGrid.monthLabel} (${monthEvents.length})`}
        </button>
      </div>

      {/* Calendar section: Horizontally scrollable weeks OR Month grid with next-month controls */}
      {view === "week" ? (
        <section aria-label="Weekly calendar" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-on-dark-muted">
              {formatCompactDate(weekStart)} – {formatCompactDate(weekEnd)}
            </span>

            <div className="flex items-center gap-2">
              {activeWeekIndex !== currentWeekIndex && (
                <button
                  type="button"
                  onClick={() => {
                    scrollToWeek(currentWeekIndex);
                    setSelectedDate(today);
                  }}
                  className="rounded-full bg-lime/10 px-3 py-1 text-xs font-semibold text-lime ring-1 ring-lime/30 transition-colors hover:bg-lime/25"
                >
                  This week
                </button>
              )}
              <button
                type="button"
                aria-label="Previous week"
                disabled={activeWeekIndex <= 0}
                onClick={() => scrollToWeek(activeWeekIndex - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-on-dark transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <button
                type="button"
                aria-label="Next week"
                disabled={activeWeekIndex >= weeks.length - 1}
                onClick={() => scrollToWeek(activeWeekIndex + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-on-dark transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>

          <div
            ref={weekScrollerRef}
            onScroll={handleWeekScroll}
            className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {weeks.map((week) => (
              <div
                key={week.weekStart}
                className="grid w-full shrink-0 snap-start grid-cols-7 gap-2 sm:gap-2"
              >
                {week.days.map((day) => {
                  const count = eventsByDate.get(day.date)?.length ?? 0;
                  const isSelected = activeSelectedDate === day.date;
                  const isBeforeCurrentMonth = day.date < currentMonthStart;

                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={isBeforeCurrentMonth}
                      aria-pressed={isSelected}
                      aria-label={`${formatCompactDate(day.date)}, ${count} ${count === 1 ? "event" : "events"}`}
                      onClick={() => setSelectedDate(day.date)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-3 transition-all duration-base ease-standard sm:rounded-full sm:py-3",
                        isBeforeCurrentMonth && "cursor-not-allowed opacity-35",
                        isSelected
                          ? "bg-lime text-ink"
                          : day.isToday
                            ? "bg-surface-raised text-on-dark ring-1 ring-ring"
                            : "bg-surface text-on-dark ring-1 ring-glass-border/10 hover:bg-surface-raised",
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          isSelected ? "text-ink/80" : "text-on-dark-muted",
                        )}
                      >
                        {day.weekdayShort}
                      </span>
                      <span className="text-base font-bold leading-none sm:text-lg">
                        {day.dayNumber}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section
          aria-label={`${monthGrid.monthLabel} calendar`}
          className="surface-card p-3 sm:p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-on-dark">
              {monthGrid.monthLabel}
            </h2>
            <div className="flex items-center gap-2">
              {monthOffset > 0 && (
                <button
                  type="button"
                  onClick={() => handleMonthChange(0)}
                  className="rounded-full bg-lime/10 px-3 py-1 text-xs font-semibold text-lime ring-1 ring-lime/30 transition-colors hover:bg-lime/25"
                >
                  This month
                </button>
              )}
              <button
                type="button"
                aria-label="Previous month"
                disabled={monthOffset <= 0}
                onClick={() => handleMonthChange(monthOffset - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-on-dark transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => handleMonthChange(monthOffset + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-on-dark transition-colors hover:bg-line"
              >
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAY_HEADERS.map((weekday) => (
              <div
                key={weekday}
                className="py-1 text-center text-2xs font-bold uppercase tracking-wide text-on-dark-muted"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: monthGrid.leadingEmptyCount }, (_, i) => (
              <div key={`empty-${i}`} aria-hidden="true" />
            ))}

            {monthGrid.days.map((day) => {
              const count = eventsByDate.get(day.date)?.length ?? 0;
              const isSelected = activeSelectedDate === day.date;

              return (
                <button
                  key={day.date}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${formatCompactDate(day.date)}, ${count} ${count === 1 ? "event" : "events"}`}
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    "flex min-h-[46px] flex-col items-center justify-center gap-1 rounded-md py-2 transition-colors duration-base ease-standard sm:min-h-[54px]",
                    isSelected
                      ? "bg-lime text-ink"
                      : day.isToday
                        ? "bg-surface-raised text-on-dark ring-1 ring-ring"
                        : "bg-background/40 text-on-dark hover:bg-surface-raised",
                  )}
                >
                  <span className="text-sm font-bold leading-none">
                    {day.dayNumber}
                  </span>
                  <span className="flex h-2 items-center gap-1">
                    {count > 0 && (
                      <>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-2 w-2 rounded-full",
                            isSelected ? "bg-ink" : "bg-lime",
                          )}
                        />
                        {count > 1 && (
                          <span
                            className={cn(
                              "text-xs font-bold leading-none",
                              isSelected ? "text-ink" : "text-lime",
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Active day / period heading */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <h2 className="text-base font-semibold text-on-dark">
          {activeSelectedDate
            ? formatCompactDate(activeSelectedDate)
            : view === "week"
              ? `${formatCompactDate(weekStart)} – ${formatCompactDate(weekEnd)}`
              : monthGrid.monthLabel}
        </h2>
        <span className="text-xs font-medium text-on-dark-muted">
          {visibleEvents.length}{" "}
          {visibleEvents.length === 1 ? "event" : "events"}
        </span>
      </div>

      {/* Vertically scrolling timeline (mobile & desktop) */}
      {visibleEvents.length > 0 ? (
        <EventTimeline
          key={`${view}-${monthOffset}-${activeWeekIndex}-${activeSelectedDate ?? "all"}`}
          events={visibleEvents}
          now={now}
          userDisplayName={userDisplayName}
          showDayHeaders={activeSelectedDate === null}
          onSelectEvent={(event) => setModalEventId(event.id)}
          label={
            activeSelectedDate
              ? `Events on ${formatCompactDate(activeSelectedDate)}`
              : view === "week"
                ? "Events this week"
                : `Events in ${monthGrid.monthLabel}`
          }
        />
      ) : (
        <motion.section
          key={`empty-${view}-${monthOffset}-${activeWeekIndex}-${activeSelectedDate ?? "all"}`}
          aria-label="No events"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduce ? 0.15 : 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="surface-card flex flex-col items-start gap-4 p-6"
        >
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-on-dark">
              {activeSelectedDate
                ? `No events on ${formatCompactDate(activeSelectedDate)}`
                : view === "week"
                  ? "No events this week"
                  : `No events in ${monthGrid.monthLabel}`}
            </h3>
          </div>
        </motion.section>
      )}

      <EventDetailsModal
        event={modalEvent}
        open={modalEvent !== null}
        userId={userId}
        now={now}
        onClose={closeModal}
      />
    </div>
  );
}
