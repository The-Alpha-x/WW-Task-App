"use client";

import { useCallback, useState } from "react";
import { getFirebaseErrorMessage } from "@/lib/errors";

/**
 * Runs an async action (usually a service call) and tracks its pending and
 * error state, so components do not repeat try/catch + error state.
 * `run` resolves to true on success and false on failure (never rejects).
 */
export function useAction(defaultFallback = "Something went wrong.") {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(
    async (
      action: () => Promise<unknown>,
      fallbackMessage = defaultFallback,
    ): Promise<boolean> => {
      setError("");
      setPending(true);
      try {
        await action();
        return true;
      } catch (caught) {
        setError(getFirebaseErrorMessage(caught, fallbackMessage));
        return false;
      } finally {
        setPending(false);
      }
    },
    [defaultFallback],
  );

  return { run, pending, error };
}
