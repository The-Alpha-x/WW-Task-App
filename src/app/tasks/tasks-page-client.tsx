"use client";

import { DataBoundary } from "@/components/layout/DataBoundary";
import { TasksOverview } from "@/components/tasks/TasksOverview";
import { useUserTasks } from "@/hooks/useUserTasks";
import { getUserDisplayName } from "@/lib/user-display";

export function TasksPageClient() {
  const { tasks, loading, error, user } = useUserTasks();

  return (
    <DataBoundary
      loading={loading}
      error={error}
      loadingMessage="Loading your tasks"
    >
      {user ? (
        <div className="py-6">
          <TasksOverview
            tasks={tasks}
            userId={user.uid}
            userName={getUserDisplayName(user)}
            avatarSrc={user.photoURL}
          />
        </div>
      ) : null}
    </DataBoundary>
  );
}
