/** Message of a thrown value, or `fallback` when it is not an Error. */
function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * "Could not save expense: <message>" for Errors, "Could not save expense."
 * for anything else. `prefix` is the text before the colon, without a period.
 */
export function describeError(error: unknown, prefix: string): string {
  return error instanceof Error ? `${prefix}: ${error.message}` : `${prefix}.`;
}

const FIREBASE_MESSAGES: Record<string, string> = {
  "permission-denied": "You do not have permission to do that. Try signing in again.",
  unauthenticated: "Your session has expired. Sign in again to continue.",
  unavailable: "Could not reach the server. Check your connection and try again.",
  "deadline-exceeded": "The request took too long. Check your connection and try again.",
  "resource-exhausted": "Too many requests right now. Wait a moment and try again.",
  "not-found": "This item no longer exists.",
  "failed-precondition": "This change could not be applied. Refresh the page and try again.",
};

/**
 * Friendly text for known Firebase error codes (with or without the
 * `firestore/` prefix); anything else falls back to `getErrorMessage`.
 */
export function getFirebaseErrorMessage(error: unknown, fallback: string): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code).replace(/^firestore\//, "")
      : "";
  return FIREBASE_MESSAGES[code] ?? getErrorMessage(error, fallback);
}
