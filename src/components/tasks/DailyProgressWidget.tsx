"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CircularProgressBar } from "@/components/ui/CircularProgressBar";

export interface DailyProgressWidgetProps {
  completedToday: number;
  totalToday: number;
}

/**
 * Clean, bold daily progress widget using CircularProgressBar and theme colors.
 */
export function DailyProgressWidget({
  completedToday,
  totalToday,
}: DailyProgressWidgetProps) {
  const reduceMotion = useReducedMotion();
  const percent =
    totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  return (
    <motion.section
      aria-label="Daily tasks progress"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="rounded-xl bg-lime p-6 text-ink shadow-lime-pill sm:p-8"
    >
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="h-32 w-32 shrink-0 sm:h-36 sm:w-36">
          <CircularProgressBar
            number={percent}
            numberSuffix="%"
            percent={percent}
            strokeWidth={11}
            barColor="rgb(var(--color-ink))"
            trackColor="rgb(var(--color-ink) / 0.16)"
            numberColor="rgb(var(--color-ink))"
            font={{
              fontSize: "34px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
            duration={1.1}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-stat font-bold leading-none tracking-tight text-ink">
              {completedToday}
            </span>
            <span className="text-2xl font-bold text-ink/60 sm:text-3xl">
              / {totalToday}
            </span>
          </div>
          <p className="text-lg font-bold text-ink sm:text-xl">
            Tasks completed today
          </p>
        </div>
      </div>
    </motion.section>
  );
}
