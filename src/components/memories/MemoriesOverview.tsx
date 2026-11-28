"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookHeart, Plus } from "lucide-react";
import { ADD_MEMORY_HREF } from "@/lib/navigation";
import type { Memory } from "@/types/memory";
import { MemoryTimeline } from "./MemoryTimeline";
import { MemoryDetailsModal } from "./MemoryDetailsModal";

export interface MemoriesOverviewProps {
  /** Every memory of the user, newest first (from the live listener). */
  memories: readonly Memory[];
  userId: string;
  now: Date;
  /** Optional deep-linked memory ID (`?memory=<id>`) to open in the modal. */
  initialMemoryId?: string | null;
  onClearInitialMemory?: () => void;
}

/**
 * Memories overview: a "walk down memory lane" vertical timeline grouped by
 * month, newest first, with a glassy details modal for view / edit / delete.
 */
export function MemoriesOverview({
  memories,
  userId,
  now,
  initialMemoryId = null,
  onClearInitialMemory,
}: MemoriesOverviewProps) {
  const [modalMemoryId, setModalMemoryId] = useState<string | null>(
    initialMemoryId,
  );

  useEffect(() => {
    if (initialMemoryId) setModalMemoryId(initialMemoryId);
  }, [initialMemoryId]);

  const modalMemory = useMemo(
    () =>
      modalMemoryId
        ? (memories.find((item) => item.id === modalMemoryId) ?? null)
        : null,
    [memories, modalMemoryId],
  );

  const closeModal = () => {
    setModalMemoryId(null);
    if (initialMemoryId) onClearInitialMemory?.();
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      {/* Header matching the events page */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="type-display-lg text-on-dark">Memories</h1>
          <p className="type-body text-on-dark-muted">
            {memories.length === 0
              ? "No memories saved yet — start capturing moments"
              : `${memories.length} ${memories.length === 1 ? "memory" : "memories"} down memory lane`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-xs font-semibold text-on-dark ring-1 ring-glass-border/10 sm:text-sm">
            <BookHeart aria-hidden="true" size={15} className="text-lime" />
            <span>{memories.length}</span>
          </span>

          <Link
            href={ADD_MEMORY_HREF}
            aria-label="Add memory"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-ink transition-colors hover:bg-lime-soft active:brightness-95"
          >
            <Plus aria-hidden="true" size={19} strokeWidth={2} />
          </Link>
        </div>
      </header>

      {/* Timeline */}
      {memories.length > 0 ? (
        <MemoryTimeline
          memories={memories}
          now={now}
          label="Memories timeline"
          onSelectMemory={(memory) => setModalMemoryId(memory.id)}
        />
      ) : (
        <div className="surface-card flex flex-col items-center gap-5 px-6 py-16 text-center">
          <span
            aria-hidden="true"
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-raised text-lime"
          >
            <BookHeart size={30} strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="type-h3 text-on-dark">
              Start your memory lane
            </h2>
            <p className="max-w-[32ch] text-sm font-medium text-on-dark-muted">
              Add your first memory — a birthday, a trip, a quiet moment worth
              remembering.
            </p>
          </div>
          <Link
            href={ADD_MEMORY_HREF}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-ink transition-colors hover:bg-lime-soft"
          >
            <Plus aria-hidden="true" size={16} strokeWidth={2.5} />
            Add your first memory
          </Link>
        </div>
      )}

      {/* Details modal */}
      <MemoryDetailsModal
        memory={modalMemory}
        open={Boolean(modalMemory)}
        userId={userId}
        now={now}
        onClose={closeModal}
      />
    </div>
  );
}
