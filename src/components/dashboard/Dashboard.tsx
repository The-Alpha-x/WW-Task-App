"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { DataBoundary } from "@/components/layout/DataBoundary";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardStatistics } from "./DashboardStatistics";
import { DashboardTasks } from "./DashboardTasks";
import { useUserTasks } from "@/hooks/useUserTasks";
import { getLocalDate } from "@/lib/date-time";
import { getUserDisplayName } from "@/lib/user-display";
import {
  countCompletedToday,
  countPlannedToday,
  selectOpenTasks,
} from "@/services/tasks";

function getTodayLabel() {
  const parts = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${values.weekday}.${values.day}.${values.month}`.toUpperCase();
}

export function Dashboard() {
  const { tasks, loading, error, user } = useUserTasks();
  const today = getLocalDate();
  const plannedCount = countPlannedToday(tasks, today);
  const completedCount = countCompletedToday(tasks, today);
  const name = getUserDisplayName(user);

  return (
    <DataBoundary
      loading={loading}
      error={error}
      loadingMessage="Loading your tasks"
    >
      <PageContainer className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,var(--size-dashboard-column))_minmax(0,1fr)] xl:items-start xl:gap-x-12">
        <div className="flex flex-col gap-6">
          <DashboardHeader
            userName={name}
            plannedCount={plannedCount}
          />
          <DashboardStatistics
            completedCount={completedCount}
            plannedCount={plannedCount}
            plannedDate={getTodayLabel()}
          />
        </div>

        <DashboardTasks
          tasks={selectOpenTasks(tasks)}
          userId={user?.uid ?? ""}
          className="mt-2 xl:mt-0 xl:max-w-xl"
        />
      </PageContainer>
    </DataBoundary>
  );
}
