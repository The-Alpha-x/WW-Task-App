"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  /** Controlled visibility. */
  open: boolean;
  /** Called for every close request: close button, Escape, backdrop click. */
  onClose: () => void;
  /** Dialog title. Required: it is the dialog's accessible name. */
  title: string;
  /** Optional supporting text under the title (used as the accessible description). */
  description?: string;
  children?: ReactNode;
  /** Optional action row, e.g. Buttons. Right-aligned. */
  footer?: ReactNode;
  /** Desktop width: sm 384px, md 512px (default), lg 704px. Mobile is always full width. */
  size?: ModalSize;
  /** Close when the backdrop is clicked. Defaults to true. */
  closeOnBackdrop?: boolean;
  /** Applied to the content wrapper inside the dialog. */
  className?: string;
}

type Phase = "closed" | "open" | "closing";

/** Safety net in case `animationend` never fires. Longer than --duration-base. */
const EXIT_FALLBACK_MS = 400;

/**
 * Centered dialog on desktop, bottom sheet below `md`.
 * Built on the native <dialog> element (modal), so focus is trapped, the page
 * behind is inert, Escape works and focus returns to the trigger on close.
 * Layout and motion live in `.modal` (globals.css); motion respects
 * prefers-reduced-motion through the global rule.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressStartedOnBackdrop = useRef(false);
  const latest = useRef({ open, onClose });
  const titleId = useId();
  const descriptionId = useId();

  // Keep the dialog mounted while the exit animation plays.
  const [phase, setPhase] = useState<Phase>(open ? "open" : "closed");
  if (open && phase !== "open") setPhase("open");
  if (!open && phase === "open") setPhase("closing");

  useEffect(() => {
    latest.current = { open, onClose };
  });

  const finishClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setPhase("closed");
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (phase === "open") {
      if (!dialog.open) dialog.showModal();
      return;
    }

    if (phase === "closing") {
      const timer = window.setTimeout(finishClose, EXIT_FALLBACK_MS);
      return () => window.clearTimeout(timer);
    }
  }, [phase, finishClose]);

  if (phase === "closed") return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    // Only a press that started AND ended on the backdrop closes the dialog,
    // so dragging a text selection out of the panel does not dismiss it.
    const startedOnBackdrop = pressStartedOnBackdrop.current;
    pressStartedOnBackdrop.current = false;
    if (closeOnBackdrop && startedOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      data-state={phase}
      data-size={size}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onPointerDown={(event) => {
        pressStartedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={handleBackdropClick}
      onCancel={(event) => {
        // Escape: let the parent decide, so the exit animation can run.
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        // The browser closed the dialog itself (e.g. a repeated Escape press).
        if (latest.current.open) latest.current.onClose();
      }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && phase === "closing") finishClose();
      }}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-3 md:p-6",
          className,
        )}
      >
        {/* Grab handle — mobile bottom sheet */}
        <span
          aria-hidden="true"
          className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-glass-border/20 md:hidden"
        />

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-glass-border/10 pb-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-bold text-on-dark">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-on-dark-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton
            icon={X}
            label="Close"
            size="sm"
            onClick={onClose}
            className="shrink-0 text-on-dark-muted hover:text-on-dark"
          />
        </div>

        {children && (
          <div className="-mx-1 mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1">
            {children}
          </div>
        )}

        {footer && (
          <div className="mt-6 flex shrink-0 flex-wrap justify-end gap-3 border-t border-glass-border/10 pt-5">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
