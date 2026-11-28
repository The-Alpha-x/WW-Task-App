import { Suspense } from "react";
import type { Metadata } from "next";
import { EventsPageClient } from "./events-page-client";

export const metadata: Metadata = {
  title: "Events",
};

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-5xl p-6">
          <h1 className="type-display-lg text-on-dark">Events</h1>
          <p className="mt-4 text-on-dark-muted">Loading events...</p>
        </main>
      }
    >
      <EventsPageClient />
    </Suspense>
  );
}
