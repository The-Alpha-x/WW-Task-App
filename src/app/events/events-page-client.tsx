"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { EventsOverview } from "@/components/events/EventsOverview";
import { EventListSkeleton } from "@/components/events/EventSkeletons";
import { useNow } from "@/hooks/useNow";
import { useUserEvents } from "@/hooks/useUserEvents";
import { EVENTS_HREF } from "@/lib/navigation";
import { getUserCollectionDisplayName } from "@/services/events";

const NOTICE_MS = 5000;

export interface EventsPageClientProps {
  /** Optional `?event=<id>` opens that event's glassy details modal. */
  requestedEventId: string | null;
  /** `?notice=deleted` is set if navigated with a notice query param. */
  notice: string | null;
}

/**
 * Client side of `/events`: renders the calendar & timeline overview and
 * opens the glassy `EventDetailsModal` when an event is clicked (or linked
 * via `?event=<id>`).
 */
export function EventsPageClient({ requestedEventId, notice }: EventsPageClientProps) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState("");

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
      onClearRequestedEvent={() => router.replace(EVENTS_HREF)}
      onDismissMessage={() => setMessage("")}
      onRetry={() => setAttempt((count) => count + 1)}
    />
  );
}

interface EventsDataProps {
  requestedEventId: string | null;
  message: string;
  onClearRequestedEvent: () => void;
  onDismissMessage: () => void;
  onRetry: () => void;
}

function EventsData({
  requestedEventId,
  message,
  onClearRequestedEvent,
  onDismissMessage,
  onRetry,
}: EventsDataProps) {
  const { events, loading, error, user } = useUserEvents();
  const now = useNow();
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setUserDisplayName(null);
      return;
    }
    let active = true;
    setUserDisplayName(user.displayName ?? null);
    void getUserCollectionDisplayName(user.uid)
      .then((name) => {
        if (active && name !== null) setUserDisplayName(name);
      })
      .catch(() => {
        // Keep auth displayName fallback on read error.
      });
    return () => {
      active = false;
    };
  }, [user?.uid, user?.displayName]);

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
        <h1 className="text-2xl font-bold text-on-dark">Events</h1>
        <EventListSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <EventsOverview
        events={events}
        userId={user.uid}
        userDisplayName={userDisplayName}
        now={now}
        initialEventId={requestedEventId}
        onClearInitialEvent={onClearRequestedEvent}
        notice={message}
        onDismissNotice={onDismissMessage}
      />
    </PageContainer>
  );
}
