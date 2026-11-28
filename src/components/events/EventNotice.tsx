"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CircleAlert, Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface EventNoticeProps {
  /** `success` is the lime confirmation, `error` the outlined red message. */
  variant: "success" | "error";
  children: ReactNode;
  /** Shows a close button. Omit for messages that should stay until fixed. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * One inline feedback message. Errors are `role="alert"` (announced at once),
 * confirmations are `role="status"` (announced politely). It animates in and
 * out; the parent wraps it in `AnimatePresence` so the exit can play.
 */
export function EventNotice({
  variant,
  children,
  onDismiss,
  className,
}: EventNoticeProps) {
  const reduce = useReducedMotion();
  const success = variant === "success";

  return (
    <motion.div
      role={success ? "status" : "alert"}
      layout={reduce ? false : "position"}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex items-start gap-3 rounded-md px-4 py-3 text-sm font-semibold",
        success
          ? "bg-lime text-ink"
          : "border border-danger/40 bg-danger/10 text-on-dark",
        className,
      )}
    >
      {success ? (
        <Check aria-hidden="true" size={20} strokeWidth={3} className="mt-px shrink-0" />
      ) : (
        <CircleAlert aria-hidden="true" size={20} className="mt-px shrink-0 text-danger" />
      )}
      <p className="min-w-0 flex-1">{children}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className={cn(
            "-m-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
            success ? "hover:bg-ink/10" : "hover:bg-surface-raised",
          )}
        >
          <X aria-hidden="true" size={16} />
        </button>
      )}
    </motion.div>
  );
}
