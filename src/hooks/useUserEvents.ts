"use client";

import { watchEvents } from "@/services/events";
import { useUserCollection } from "./useUserCollection";

/**
 * Live list of the signed-in user's events (earliest first). One listener
 * feeds both the list and the details view; writes go through
 * `@/services/events`, and the listener delivers every change.
 */
export function useUserEvents() {
  const { items, loading, error, user } = useUserCollection(
    watchEvents,
    "Could not load events",
  );
  return { events: items, loading, error, user };
}
