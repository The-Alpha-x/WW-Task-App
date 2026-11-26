import Link from "next/link";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ADD_TASK_HREF } from "@/lib/navigation";

export interface TasksHeaderProps {
  userName: string;
  avatarSrc?: string | null;
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Responsive Tasks header: stacked greeting + full-width quick-add on mobile,
 * horizontal row with right-aligned quick-add on desktop.
 * Notification button is now handled globally by MobileTopBar / Sidebar.
 */
export function TasksHeader({
  userName,
  avatarSrc,
}: TasksHeaderProps) {
  const firstName = userName.trim().split(/\s+/)[0] || userName;
  const greeting = getTimeOfDayGreeting();

  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 md:hidden">
          <Avatar
            name={userName}
            src={avatarSrc}
            size="lg"
            className="lg:hidden"
          />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight text-on-dark md:text-2xl">
              Hi, {firstName}
            </h1>
            <p className="text-xs font-medium text-on-dark-muted md:text-sm">
              {greeting}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={ADD_TASK_HREF}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-surface/50 px-6 text-sm font-semibold text-on-dark ring-1 ring-glass-border/15 transition-colors duration-fast ease-standard hover:bg-surface-raised/60 active:scale-[0.99] md:w-auto"
        >
          <span>Add new task</span>
          <Plus aria-hidden="true" size={18} strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}
