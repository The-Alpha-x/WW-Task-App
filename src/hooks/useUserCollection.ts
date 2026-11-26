"use client";

import { useEffect, useState } from "react";
import type { Unsubscribe } from "firebase/firestore";
import { useAuth } from "@/components/auth/AuthProvider";

type Watch<T> = (
  userId: string,
  onItems: (items: T[]) => void,
  onError: (error: Error) => void,
) => Unsubscribe;

interface CollectionState<T> {
  items: T[];
  loading: boolean;
  error: string;
}

/**
 * Subscribes to one of the signed-in user's Firestore collections through a
 * service `watch*` function. `watch` must be a stable (module-level)
 * function. Loading, error and data live in one state object so every
 * transition is a single update.
 */
export function useUserCollection<T>(watch: Watch<T>, errorPrefix: string) {
  const { user } = useAuth();
  const [state, setState] = useState<CollectionState<T>>({
    items: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    if (!user) {
      setState({ items: [], loading: false, error: "" });
      return;
    }

    setState({ items: [], loading: true, error: "" });
    return watch(
      user.uid,
      (items) => setState({ items, loading: false, error: "" }),
      (error) =>
        setState({
          items: [],
          loading: false,
          error: `${errorPrefix}: ${error.message}`,
        }),
    );
  }, [user, watch, errorPrefix]);

  return { ...state, user };
}
