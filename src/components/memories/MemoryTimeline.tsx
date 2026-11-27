"use client";

import { ChevronRight, Heart, Users } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatCompactDate, formatLocalDate, getRelativeDayLabel } from "@/lib/date-time";
import {
  formatMemoryWhen,
  getMemoryAriaLabel,
  getMemoryTypeLabel,
  groupMemoriesByMonth,
} from "@/lib/memories/display";
import type { Memory } from "@/types/memory";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export interface MemoryTimelineProps {
  memories: readonly Memory[];
  now: Date;
  label: string;
  onSelectMemory: (memory: Memory) => void;
}

/**
 * Vertical "walk down memory lane" timeline, grouped by month. Each memory
 * is a frosted dark glass card with a date column, matching the EventTimeline
 * visual language. Newest memories appear first.
 */
export function MemoryTimeline({
  memories,
  now,
  label,
  onSelectMemory,
}: MemoryTimelineProps) {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.045 } },
  };

  const itemVariants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.15 : 0.35, ease: EASE_OUT },
    },
  };

  const grouped = Array.from(groupMemoriesByMonth(memories).entries());

  return (
    <motion.div
      aria-label={label}
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8"
    >
      {grouped.map(([monthKey, monthMemories]) => {
        const monthLabel = formatLocalDate(`${monthKey}-01`, {
          month: "long",
          year: "numeric",
        });

        return (
          <section key={monthKey} className="flex flex-col gap-4">
            {/* Month heading */}
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-on-dark">{monthLabel}</h3>
              <div className="h-px flex-1 bg-glass-border/15" />
              <span className="rounded-full bg-surface-raised/60 px-3 py-1 text-2xs font-bold tabular-nums text-lime/80">
                {monthMemories.length}
              </span>
            </div>

            {/* Memory cards */}
            <ul className="flex flex-col gap-3">
              {monthMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  now={now}
                  variants={itemVariants}
                  reduce={reduce}
                  onSelect={onSelectMemory}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

interface MemoryCardProps {
  memory: Memory;
  now: Date;
  variants: Variants;
  reduce: boolean | null;
  onSelect: (memory: Memory) => void;
}

function MemoryCard({ memory, now, variants, reduce, onSelect }: MemoryCardProps) {
  const relative = getRelativeDayLabel(memory.date, now);
  const subtitle = memory.description.trim() || memory.notes.trim() || formatMemoryWhen(memory);

  // Date tile parts
  const day = formatLocalDate(memory.date, { day: "numeric" });
  const weekday = formatLocalDate(memory.date, { weekday: "short" });

  return (
    <motion.li
      variants={variants}
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      className="flex items-stretch gap-3 sm:gap-4"
    >
      {/* Date column */}
      <div
        aria-hidden="true"
        className="flex w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-glass/50 py-3 text-center ring-1 ring-glass-border/10 sm:w-14"
      >
        <span className="text-2xs font-semibold uppercase tracking-wide text-on-dark-muted">
          {weekday}
        </span>
        <span className="text-lg font-bold leading-tight text-lime">{day}</span>
      </div>

      {/* Card */}
      <article
        style={{
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          backdropFilter: "blur(20px) saturate(180%)",
        }}
        className="group relative flex min-w-0 flex-1 flex-col gap-3 rounded-xl bg-glass/75 p-4 shadow-glass ring-1 ring-glass-border/10 transition-all duration-base ease-standard hover:bg-surface/75 hover:ring-glass-border/20 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-on-dark sm:p-5"
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold leading-snug tracking-tight text-on-dark sm:text-lg">
                <button
                  type="button"
                  onClick={() => onSelect(memory)}
                  aria-label={getMemoryAriaLabel(memory)}
                  className="line-clamp-2 text-left after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
                >
                  {memory.title}
                </button>
              </h3>
              <ChevronRight
                aria-hidden="true"
                size={16}
                className="mt-1 shrink-0 text-on-dark-muted/50 transition-transform duration-base ease-standard group-hover:translate-x-1 group-hover:text-on-dark"
              />
            </div>

            <p className="mt-1 line-clamp-2 text-sm font-medium text-on-dark-muted">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {relative && (
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-card ring-1 ring-lime/25">
                {relative}
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-2xs font-semibold text-on-dark-muted">
              <Heart aria-hidden="true" size={10} className="text-pink" />
              Memory
            </span>
          </div>

          <span className="flex items-center gap-1" aria-label="Shared memory">
            <span className="inline-flex items-center gap-1 rounded-full px-1 py-1 text-2xs font-semibold ring-1 bg-pink/15 text-pink ring-pink/25">
              <Users aria-hidden="true" size={11} />
            </span>
            <span className="inline-flex items-center gap-1 rounded-full px-1 py-1 text-2xs font-semibold ring-1 bg-blue/15 text-blue ring-blue/25">
              <Users aria-hidden="true" size={11} />
            </span>
          </span>
        </div>
      </article>
    </motion.li>
  );
}
