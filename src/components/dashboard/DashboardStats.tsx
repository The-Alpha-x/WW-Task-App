"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";

export interface DashboardStatsProps {
  completedTasks: number;
  remainingTasks: number;
  todayEvents: number;
  weekTasks: number;
  todayLabel: string;
}

/**
 * Daily & weekly overview using the reference notched StatCard tiles
 * with Framer Motion roll-up counters on first load (2x2 grid).
 */
export function DashboardStats({
  completedTasks,
  remainingTasks,
  todayEvents,
  weekTasks,
  todayLabel,
}: DashboardStatsProps) {
  const router = useRouter();
  const reduce = useReducedMotion();

  return (
    <section
      aria-label="Daily overview"
      className="grid max-w-[36rem] grid-cols-2 gap-4"
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease: "easeOut" }}
        className="col-span-2"
      >
        <StatCard
          variant="planned"
          value={remainingTasks}
          label="Tasks Remaining"
          date={todayLabel}
          animateValue
          onAction={() => router.push("/tasks")}
          actionLabel="View remaining tasks"
          className="stat-card--hero"
        />
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
      >
        <StatCard
          variant="completed"
          value={completedTasks}
          label="Tasks Completed"
          animateValue
          onAction={() => router.push("/tasks")}
          actionLabel="View completed tasks"
        />
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" }}
      >
        <StatCard
          variant="events"
          value={todayEvents}
          label="Events Today"
          animateValue
          onAction={() => router.push("/events")}
          actionLabel="View today's events"
        />
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24, ease: "easeOut" }}
        className="col-span-2"
      >
        <StatCard
          variant="week"
          value={weekTasks}
          label="Tasks This Week"
          animateValue
          onAction={() => router.push("/tasks")}
          actionLabel="View this week's tasks"
          className="stat-card--wide"
        />
      </motion.div>
    </section>
  );
}
