"use client";

import { useEffect, useState } from "react";

/**
 * The current moment, refreshed every minute, so "upcoming" lists and
 * relative labels ("Today", "Tomorrow") move on by themselves while a page
 * stays open. Event times are minute-precise, so one tick per minute is enough.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
