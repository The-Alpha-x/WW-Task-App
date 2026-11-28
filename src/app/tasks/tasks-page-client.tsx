"use client";

import { DataBoundary } from "@/components/layout/DataBoundary";
import { TasksOverview } from "@/components/tasks/TasksOverview";
import { useUserTasks } from "@/hooks/useUserTasks";
import { getUserDisplayName } from "@/lib/user-display";

export function TasksPageClient() {
  const { tasks, loading, error, user } = useUserTasks();

  // The overview renders the page header, so keep the title on the error state.
  if (!loading && error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="type-display-lg text-on-dark">Tasks</h1>
        <p role="alert" className="form-alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <DataBoundary
      loading={loading}
      error={error}
      loadingMessage="Loading your tasks"
    >
      {user ? (
        <TasksOverview
          tasks={tasks}
          userId={user.uid}
          userName={getUserDisplayName(user)}
          avatarSrc={user.photoURL}
        />
      ) : null}
    </DataBoundary>
  );
}
