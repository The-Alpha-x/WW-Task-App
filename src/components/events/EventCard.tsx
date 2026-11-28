"use client";

import Link from "next/link";
import { Clock3, MapPin, User, Users } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { ParticipantBadges } from "@/components/ui/ParticipantBadges";
import { cn } from "@/lib/cn";
import {
  formatEventTime,
  getEventAriaLabel,
  getEventDateParts,
  getEventTypeBadgeVariant,
  getEventTypeLabel,
  getRelativeDayLabel,
} from "@/lib/events/display";
import { getEventHref } from "@/lib/navigation";
import type { Event } from "@/types/event";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export interface EventCardProps {
  event: Event;
  /** The current minute, for the "Today" / "In 3 days" label. */
  now: Date;
  /** Current user's display name for participant accent color. */
  userDisplayName?: string | null;
  /** The next event: a lime sheet instead of the white card. */
  featured?: boolean;
  /** Past events read quieter and show "3 days ago". */
  past?: boolean;
  className?: string;
}

/**
 * One event in the list. The whole card is one link: the title is the real
 * `<a>` and stretches over the card, so there is a single tab stop and no
 * interactive content is nested. The entrance (fade and rise) is driven by the
 * parent list's stagger; hover and tap are small and respect reduced motion.
 */
export function EventCard({
  event,
  now,
  userDisplayName = null,
  featured = false,
  past = false,
  className,
}: EventCardProps) {
  const reduce = useReducedMotion();
  const parts = getEventDateParts(event.date);
  const relative = getRelativeDayLabel(event.date, now);
  const TypeIcon = event.type === "shared" ? Users : User;

  const variants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.2 : 0.45, ease: EASE_OUT },
    },
  };

  const typeBadge = (
    <Badge variant={getEventTypeBadgeVariant(event.type)}>
      <TypeIcon aria-hidden="true" size={14} />
      {getEventTypeLabel(event.type)}
    </Badge>
  );

  return (
    <motion.li
      variants={variants}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      className={cn("rounded-lg", className)}
    >
      <article
        className={cn(
          "relative flex h-full gap-4 rounded-lg p-5 text-ink transition-colors duration-base ease-standard has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-lime md:p-6",
          featured ? "bg-lime md:gap-6" : "bg-card hover:bg-card-muted",
          past && !featured && "opacity-80",
        )}
      >
        {/* Date tile: the one dark shape on a light card. */}
        <div
          aria-hidden="true"
          className={cn(
            "flex shrink-0 flex-col items-center justify-center rounded-md bg-ink text-on-accent",
            featured ? "h-24 w-20 md:h-28 md:w-24" : "h-20 w-16",
          )}
        >
          <span className="text-xs font-semibold text-on-accent-muted">{parts.weekday}</span>
          <span
            className={cn(
              "font-bold leading-none",
              featured ? "text-3xl text-lime md:text-[2.5rem]" : "text-2xl text-lime",
            )}
          >
            {parts.day}
          </span>
          <span className="text-xs font-semibold">{parts.month}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {featured && !past && (
            <p className="text-sm font-bold">{relative ? `Next up: ${relative}` : "Next up"}</p>
          )}
          <h3 className={cn("min-w-0 font-semibold", featured ? "text-2xl" : "text-xl")}>
            <Link
              href={getEventHref(event.id)}
              aria-label={getEventAriaLabel(event)}
              className="line-clamp-2 after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
            >
              {event.title}
            </Link>
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* Orange time badge as in the reference; on the lime sheet it turns neutral. */}
            <Badge variant={featured ? "default" : "orange"}>
              <Clock3 aria-hidden="true" size={14} />
              {formatEventTime(event.time)}
            </Badge>
            <span className="inline-flex items-center rounded-full bg-ink px-1.5 py-0.5">
              <ParticipantBadges
                type={event.type}
                userDisplayName={userDisplayName}
              />
            </span>
            {typeBadge}
            {!featured && relative && (
              <Badge variant="outline">{relative}</Badge>
            )}
          </div>

          {event.location && (
            <p
              className={cn(
                "flex items-center gap-1.5 truncate text-xs font-medium",
                featured ? "text-ink" : "text-ink-muted",
              )}
            >
              <MapPin aria-hidden="true" size={13} className="shrink-0" />
              <span className="truncate">{event.location}</span>
            </p>
          )}

          {event.description && (
            <p
              className={cn(
                "line-clamp-2 text-sm font-medium",
                featured ? "text-ink" : "text-ink-muted",
              )}
            >
              {event.description}
            </p>
          )}
        </div>
      </article>
    </motion.li>
  );
}
