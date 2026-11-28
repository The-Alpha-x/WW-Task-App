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
    <PageContainer>
      <MemoriesOverview
        memories={memories}
        userId={user.uid}
        now={now}
        initialMemoryId={requestedMemoryId}
        onClearInitialMemory={() => router.replace(MEMORIES_HREF)}
      />
    </PageContainer>
  );
}
