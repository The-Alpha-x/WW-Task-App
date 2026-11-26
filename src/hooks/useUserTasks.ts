"use client";

import { watchTasks } from "@/services/tasks";
import { useUserCollection } from "./useUserCollection";

/**
 * Live list of the signed-in user's tasks. Writes go through `@/services/tasks`;
 * the listener delivers every change, so no local copy of the list is kept.
 */
export function useUserTasks() {
  const { items, loading, error, user } = useUserCollection(
    watchTasks,
    "Could not load tasks",
  );
  return { tasks: items, loading, error, user };
}
