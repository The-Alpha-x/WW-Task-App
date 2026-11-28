"use client";

import { DataBoundary } from "@/components/layout/DataBoundary";
import { useUserLists } from "@/hooks/useUserLists";
import { getUserDisplayName } from "@/lib/user-display";
import { ListsOverview } from "./ListsOverview";

/** Client side of `/activities/lists`: loads the lists and renders the overview. */
export function ListsPageClient() {
  const { lists, loading, error, user } = useUserLists();

  if (!loading && error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="type-display-lg text-on-dark">Item Lists</h1>
        <p role="alert" className="form-alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <DataBoundary loading={loading} error={error} loadingMessage="Loading your lists">
      {user ? (
        <ListsOverview
          lists={lists}
          userId={user.uid}
          userName={getUserDisplayName(user)}
        />
      ) : null}
    </DataBoundary>
  );
}
