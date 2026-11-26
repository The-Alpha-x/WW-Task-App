export interface DashboardHeaderProps {
  /** Full name of the signed-in user. The greeting uses the first name. */
  userName: string;
  /** Number of tasks planned today, shown in the subtitle. */
  plannedCount: number;
}

/**
 * The sidebar owns the avatar and notifications on desktop; the MobileTopBar
 * handles them on mobile — no duplicate buttons needed here.
 */
export function DashboardHeader({
  userName,
  plannedCount,
}: DashboardHeaderProps) {
  const firstName = userName.trim().split(/\s+/)[0] ?? userName;
  const taskWord = plannedCount === 1 ? "task" : "tasks";

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-on-dark">Hello, {firstName}</h1>
        <p className="text-sm font-medium text-on-dark-muted">
          You have {plannedCount} {taskWord} planned for today
        </p>
      </div>
    </header>
  );
}
