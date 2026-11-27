"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { DataBoundary } from "@/components/layout/DataBoundary";
import { DashboardGreeting } from "./DashboardGreeting";
import { DashboardStats } from "./DashboardStats";
import { DashboardTasks } from "./DashboardTasks";
import { EventCountdown } from "./EventCountdown";
import { useUserTasks } from "@/hooks/useUserTasks";
import { useUserEvents } from "@/hooks/useUserEvents";
import { useNow } from "@/hooks/useNow";
import { getLocalDate } from "@/lib/date-time";
import { getUserDisplayName } from "@/lib/user-display";
import { selectTasksForTimeframe } from "@/lib/tasks/filters";

function getTodayLabel(now: Date): string {
  const parts = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${values.weekday}.${values.day}.${values.month}`.toUpperCase();
}

/**
 * Dashboard homepage:
 * 1. "Good morning, <name>" big typographic greeting
 * 2. Reference notched StatCard tiles with Framer Motion animated numbers
 * 3. Live DD:HH:MM:SS countdown to the next event + "Next Up" event
 * 4. Simplified today's tasks list with scroll animations and "View all tasks" link
 *
 * Responsive for iPhone 16 Pro (393px), iPhone 17 Pro (402px), and Full HD (1920x1080).
 */
export function Dashboard() {
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    user,
  } = useUserTasks();
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
  } = useUserEvents();
  const now = useNow(1000);

  const loading = tasksLoading || eventsLoading;
  const error = tasksError || eventsError;

  const today = getLocalDate(now);
  const todayLabel = getTodayLabel(now);
  const name = getUserDisplayName(user);

  const { pending, completed } = selectTasksForTimeframe(tasks, "today", now);
  const week = selectTasksForTimeframe(tasks, "week", now);
  const weekTasksCount = week.pending.length + week.completed.length;
  const todayEvents = events.filter((e) => e.date === today);

  return (
    <DataBoundary
      loading={loading}
      error={error}
      loadingMessage="Loading your dashboard"
    >
      <PageContainer className="flex flex-col gap-6 pb-8 xl:grid xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start xl:gap-x-10">
        <div className="flex flex-col gap-6">
          <DashboardGreeting userName={name} />

          <DashboardStats
            completedTasks={completed.length}
            remainingTasks={pending.length}
            todayEvents={todayEvents.length}
            weekTasks={weekTasksCount}
            todayLabel={todayLabel}
          />

          <EventCountdown
            events={events}
            now={now}
            userDisplayName={name}
          />
        </div>

        <DashboardTasks
          tasks={pending}
          userId={user?.uid ?? ""}
          userDisplayName={name}
          className="mt-2 xl:mt-0"
        />
      </PageContainer>
    </DataBoundary>
  );
}
