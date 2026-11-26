"use client";

import { watchBudgetExpenses } from "@/services/budget";
import { useUserCollection } from "./useUserCollection";

/** Live list of the signed-in user's budget expenses. */
export function useUserBudget() {
  const { items, loading, error, user } = useUserCollection(
    watchBudgetExpenses,
    "Could not load budget expenses",
  );
  return { expenses: items, loading, error, user };
}
