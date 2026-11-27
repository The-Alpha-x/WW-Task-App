"use client";

import { User, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import type { EventType } from "@/types/event";

export interface ParticipantBadgesProps {
  type: EventType;
  userDisplayName?: string | null;
  className?: string;
}

/**
 * Participant indicator pills matching EventTimeline:
 * - "shared": shows both Pink (Witch) and Blue (Partner) badges
 * - "individual": shows only the current user's badge (Pink for Witch, Blue otherwise)
 */
export function ParticipantBadges({
  type,
  userDisplayName = null,
  className,
}: ParticipantBadgesProps) {
  const isWitch = userDisplayName?.trim().toLowerCase() === "witch";
  const isShared = type === "shared";
  const TypeIcon = isShared ? Users : User;

  if (isShared) {
    return (
      <span
        aria-label="Shared with both participants"
        className={cn("inline-flex items-center gap-1", className)}
      >
        <span className="inline-flex items-center rounded-full bg-pink/15 p-1 text-pink ring-1 ring-pink/25">
          <TypeIcon aria-hidden="true" size={11} />
        </span>
        <span className="inline-flex items-center rounded-full bg-blue/15 p-1 text-blue ring-1 ring-blue/25">
          <TypeIcon aria-hidden="true" size={11} />
        </span>
      </span>
    );
  }

  return (
    <span
      aria-label="Personal"
      className={cn(
        "inline-flex items-center rounded-full p-1 ring-1",
        isWitch
          ? "bg-pink/15 text-pink ring-pink/25"
          : "bg-blue/15 text-blue ring-blue/25",
        className,
      )}
    >
      <TypeIcon aria-hidden="true" size={11} />
    </span>
  );
}

