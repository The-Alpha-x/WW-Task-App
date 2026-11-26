"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  /** Image URL. Falls back to initials when missing or broken. */
  src?: string | null;
  /** Person's name: used for alt text and for the initials fallback. */
  name: string;
  size?: AvatarSize;
  className?: string;
}

/** sm 32px, md 40px, lg 48px (reference size), xl 64px. */
const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const imageSizes: Record<AvatarSize, string> = {
  sm: "32px",
  md: "40px",
  lg: "48px",
  xl: "64px",
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]?.charAt(0) ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({ src, name, size = "lg", className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-surface-raised font-bold text-on-dark",
        sizeClasses[size],
        className,
      )}
    >
      {showImage && src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={imageSizes[size]}
          unoptimized
          className="object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span role="img" aria-label={name}>
          <span aria-hidden="true">{getInitials(name)}</span>
        </span>
      )}
    </span>
  );
}
