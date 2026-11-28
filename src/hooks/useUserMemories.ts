"use client";

import { watchMemories } from "@/services/memories";
import { useUserCollection } from "./useUserCollection";

/**
 * Live list of the signed-in user's memories (newest first by memory date).
 * One listener feeds the list and details views; writes go through
 * `@/services/memories`, and the listener delivers every change.
 */
export function useUserMemories() {
  const { items, loading, error, user } = useUserCollection(
    watchMemories,
    "Could not load memories",
  );
  return { memories: items, loading, error, user };
}
