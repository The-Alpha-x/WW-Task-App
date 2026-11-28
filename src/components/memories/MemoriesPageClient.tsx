"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CloudOff } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { MemoriesOverview } from "@/components/memories/MemoriesOverview";
import { MemoryListSkeleton } from "@/components/memories/MemorySkeletons";
import { useNow } from "@/hooks/useNow";
import { useUserMemories } from "@/hooks/useUserMemories";
import { MEMORIES_HREF } from "@/lib/navigation";

/**
 * Client side of `/memories`: renders the vertical timeline overview and
 * opens the glassy `MemoryDetailsModal` when a memory is clicked (or linked
 * via `?memory=<id>`).
 */
export function MemoriesPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMemoryId = searchParams.get("memory");

  const { memories, loading, error, user } = useUserMemories();
  const now = useNow();

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
            <h1 className="text-xl font-bold text-on-dark">
              Could not load your memories
            </h1>
            <p className="max-w-[48ch] text-base text-on-dark-muted">{error}</p>
          </div>
          <Button onClick={() => router.refresh()}>Try again</Button>
        </section>
      </PageContainer>
    );
  }

  if (loading || !user) {
    return (
      <PageContainer className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-on-dark">Memories</h1>
        <MemoryListSkeleton />
      </PageContainer>
    );
  }

  return (
<<<<<<< HEAD
    <PageContainer className="flex flex-col gap-6 py-8 md:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-dark">Our Memories</h1>
          <p className="mt-2 text-on-dark-muted">
            Little moments, kept close forever.
          </p>
        </div>
        <ButtonLink href={ADD_MEMORY_HREF}>Add Memory</ButtonLink>
      </header>
      {message && (
        <p role="status" className="rounded-xl bg-lime p-3 text-sm text-ink">
          {message}
        </p>
      )}
      {memories.length === 0 ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-surface p-10 text-center">
          <BookHeart size={42} className="text-lime" />
          <h2 className="text-xl font-bold text-on-dark">
            Your memory book is waiting
          </h2>
          <p className="max-w-md text-on-dark-muted">
            Save a special day, a funny incident, or a little moment you want to
            remember together.
          </p>
          <ButtonLink href={ADD_MEMORY_HREF}>Save your first memory</ButtonLink>
        </section>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {memories.map((memory) => (
            <li key={memory.id}>
              <Link
                href={`${MEMORIES_HREF}?memory=${encodeURIComponent(memory.id)}`}
                className="group flex h-full flex-col gap-3 rounded-2xl bg-card p-5 text-ink transition hover:-translate-y-0.5 hover:bg-card-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">{dateLabel(memory.date)}</Badge>
                  <Badge
                    variant={memory.type === "shared" ? "lime" : "default"}
                  >
                    {memory.type === "shared" ? "Shared" : "Individual"}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold group-hover:underline">
                  {memory.title}
                </h2>
                {memory.description && (
                  <p className="line-clamp-3 text-sm text-ink-muted">
                    {memory.description}
                  </p>
                )}
                <span className="mt-auto flex items-center gap-2 text-sm text-ink-muted">
                  <Clock3 size={14} />
                  {timeLabel(memory.time)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
=======
    <PageContainer>
      <MemoriesOverview
        memories={memories}
        userId={user.uid}
        now={now}
        initialMemoryId={requestedMemoryId}
        onClearInitialMemory={() => router.replace(MEMORIES_HREF)}
      />
>>>>>>> 0458a41ce1ecdcdbe6a5667663ed447a1358b48b
    </PageContainer>
  );
}
