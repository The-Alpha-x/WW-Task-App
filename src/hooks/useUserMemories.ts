"use client";
import { useUserCollection } from "./useUserCollection";
import { watchMemories } from "@/services/memories";
export function useUserMemories() {
  const { items, loading, error, user } = useUserCollection(watchMemories, "Could not load memories");
  return { memories: items, loading, error, user };
}
