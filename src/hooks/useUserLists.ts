"use client";

import { watchLists } from "@/services/lists";
import { useUserCollection } from "./useUserCollection";

/**
 * Live lists the signed-in user may see (shared lists plus their own),
 * newest first by creation date. Writes go through `@/services/lists`; the
 * listener delivers every change.
 */
export function useUserLists() {
  const { items, loading, error, user } = useUserCollection(
    watchLists,
    "Could not load lists",
  );
  return { lists: items, loading, error, user };
}
