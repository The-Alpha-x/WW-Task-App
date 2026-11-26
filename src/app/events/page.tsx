import type { Metadata } from "next";
import { EventsPageClient } from "./events-page-client";

export const metadata: Metadata = { title: "Events" };

interface EventsPageProps {
  searchParams: Promise<{
    event?: string | string[];
    notice?: string | string[];
  }>;
}

const first = (value: string | string[] | undefined): string | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

/**
 * `/events` is the event list; `/events?event=<id>` opens that event's
 * details (same pattern as `/tasks?task=<id>`, so no dynamic route is needed).
 */
export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { event, notice } = await searchParams;
  return (
    <EventsPageClient requestedEventId={first(event)} notice={first(notice)} />
  );
}
