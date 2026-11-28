"use client";

import { ChevronRight } from "lucide-react";
import { ParticipantBadges } from "@/components/ui/ParticipantBadges";
import { formatListDate } from "@/lib/lists/display";
import type { ItemList } from "@/types/list";

export interface ListCardProps {
  list: ItemList;
  userDisplayName?: string | null;
  /** Opens the list (items, notes, actions). */
  onOpen: (list: ItemList) => void;
}

/**
 * Collapsed list: only the title, the type and the creation date. The whole
 * card is one button that opens the list.
 */
export function ListCard({ list, userDisplayName = null, onOpen }: ListCardProps) {
  const typeLabel = list.type === "shared" ? "Shared" : "Individual";

  return (
    <button
      type="button"
      onClick={() => onOpen(list)}
      aria-haspopup="dialog"
      aria-label={`Open ${list.title}, ${typeLabel} list, created ${formatListDate(list.createdAt)}`}
      className="surface-card flex w-full items-center gap-4 p-4 text-left transition-colors duration-fast ease-standard hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-on-dark">
          {list.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-2">
            <ParticipantBadges
              type={list.type}
              userDisplayName={userDisplayName}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-on-dark-muted">
              {typeLabel}
            </span>
          </span>
          <span className="text-xs font-medium text-on-dark-muted">
            {formatListDate(list.createdAt)}
          </span>
        </div>
      </div>
      <ChevronRight
        aria-hidden="true"
        size={18}
        className="shrink-0 text-on-dark-muted"
      />
    </button>
  );
}
