import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { ActivitiesCarousel } from "@/components/activities/ActivitiesCarousel";

export const metadata: Metadata = { title: "Activities" };

export default function ActivitiesPage() {
  const moviesDomain = process.env.MOVIES_DOMAIN?.trim() || undefined;

  return (
    <PageContainer className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-on-dark">Activities</h1>
        <p className="max-w-2xl text-sm font-medium text-on-dark-muted">
          Explore the latest featured activities.
        </p>
      </header>
      {!moviesDomain && (
        <p
          role="status"
          className="rounded-xl bg-surface p-4 text-sm text-on-dark-muted"
        >
          The Watch Movies link is unavailable because MOVIES_DOMAIN is not
          configured. Restart the server after setting it in .env.
        </p>
      )}
      <ActivitiesCarousel moviesDomain={moviesDomain} />
    </PageContainer>
  );
}
