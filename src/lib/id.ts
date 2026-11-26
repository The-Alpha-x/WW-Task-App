/** Random id for new documents; falls back to a timestamp where `crypto.randomUUID` is unavailable. */
export function generateId(fallbackPrefix = "id"): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${fallbackPrefix}-${Date.now()}`;
}
