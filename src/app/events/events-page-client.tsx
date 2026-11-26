"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, CloudOff } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Button } from "@/components/ui/Button";
import { EventDetails } from "@/components/events/EventDetails";
import { EventsOverview } from "@/components/events/EventsOverview";
import {
  EventDetailsSkeleton,
  EventListSkeleton,
} from "@/components/events/EventSkeletons";
import { useNow } from "@/hooks/useNow";
import { useUserEvents } from "@/hooks/useUserEvents";
import { EVENTS_HREF } from "@/lib/navigation";
import type { Event } from "@/types/event";

const NOTICE_MS = 5000;

export interface EventsPageClientProps {
  /** `?event=<id>` opens that event's details; without it the list shows. */
  requestedEventId: string | null;
  /** `?notice=deleted` is set by the details view after a delete. */
  notice: string | null;
}

/**
 * Client side of `/events`: the list, or one event's details. A single live
 * listener (`useUserEvents`) serves both, so opening a card never triggers a
 * second Firestore query. The inner component is re-keyed to retry after an
 * error, which restarts the listener without a page reload.
 */
export function EventsPageClient({ requestedEventId, notice }: EventsPageClientProps) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState("");

  // Turn `?notice=deleted` into a message, then clean the URL so a refresh
  // does not show it again.
  useEffect(() => {
    if (notice !== "deleted") return;
    setMessage("Event deleted.");
    router.replace(EVENTS_HREF);
  }, [notice, router]);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(""), NOTICE_MS);
    return () => window.clearTimeout(id);
  }, [message]);

  return (
    <EventsData
      key={attempt}
      requestedEventId={requestedEventId}
      message={message}
      onDismissMessage={() => setMessage("")}
      onRetry={() => setAttempt((count) => count + 1)}
    />
  );
}

interface EventsDataProps {
  requestedEventId: string | null;
  message: string;
  onDismissMessage: () => void;
  onRetry: () => void;
}

function EventsData({
  requestedEventId,
  message,
  onDismissMessage,
  onRetry,
}: EventsDataProps) {
  const { events, loading, error, user } = useUserEvents();
  const now = useNow();
  /**
   * The event being deleted. The live list drops it before the delete is
   * confirmed, so details keep rendering from this copy until the page
   * navigates away (or the delete fails and the event is back).
   */
  const [deleting, setDeleting] = useState<Event | null>(null);

  if (error) {
    return (
      <PageContainer>
        <section
          role="alert"
          className="flex flex-col items-start gap-5 rounded-2xl bg-surface p-6 md:p-8"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-background text-danger"
          >
            <CloudOff size={30} strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold text-on-dark">Could not load your events</h1>
            <p className="max-w-[48ch] text-base text-on-dark-muted">{error}</p>
          </div>
          <Button onClick={onRetry}>Try again</Button>
        </section>
      </PageContainer>
    );
  }

  if (loading || !user) {
    return (
      <PageContainer className="flex flex-col gap-6">
        {requestedEventId ? (
          <EventDetailsSkeleton />
        ) : (
          <>
            <h1 className="text-2xl font-bold text-on-dark">Events</h1>
            <EventListSkeleton />
          </>
        )}
      </PageContainer>
    );
  }

  if (requestedEventId) {
    const live = events.find((item) => item.id === requestedEventId);
    const event = live ?? (deleting?.id === requestedEventId ? deleting : null);

    if (!event) {
      return (
        <PageContainer>
          <section
            role="status"
            className="flex flex-col items-start gap-5 rounded-2xl bg-surface p-6 md:p-8"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-background text-lime"
            >
              <CalendarX2 size={30} strokeWidth={1.75} />
            </span>
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-bold text-on-dark">Event not found</h1>
              <p className="max-w-[40ch] text-base text-on-dark-muted">
                It may have been deleted, or the link is not right.
              </p>
            </div>
            <ButtonLink href={EVENTS_HREF}>Back to events</ButtonLink>
          </section>
        </PageContainer>
      );
    }

    return (
      <EventDetails
        event={event}
        userId={user.uid}
        now={now}
        onDeleteStart={setDeleting}
        onDeleteEnd={() => setDeleting(null)}
      />
    );
  }

  return (
    <PageContainer>
      <EventsOverview
        events={events}
        now={now}
        notice={message}
        onDismissNotice={onDismissMessage}
      />
    </PageContainer>
  );
}
