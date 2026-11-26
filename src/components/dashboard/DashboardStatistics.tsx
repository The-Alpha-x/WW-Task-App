import { StatCard } from "@/components/ui/StatCard";

export interface DashboardStatisticsProps {
  completedCount: number;
  plannedCount: number;
  /** Date pill on the planned tile, e.g. "TUE.13.JAN". */
  plannedDate: string;
}

/**
 * Daily overview: the completed (purple) and planned (lime) tiles side by
 * side. Two columns at every width; on larger screens the pair is capped so
 * the tiles keep the phone proportions of the reference.
 */
export function DashboardStatistics({
  completedCount,
  plannedCount,
  plannedDate,
}: DashboardStatisticsProps) {
  return (
    <section aria-label="Daily overview">
      <div className="grid grid-cols-2 gap-3 md:max-w-md">
        <StatCard
          variant="completed"
          value={completedCount}
          label="Tasks Completed"
        />
        <StatCard
          variant="planned"
          value={plannedCount}
          label="Tasks Planned"
          date={plannedDate}
        />
      </div>
    </section>
  );
}
