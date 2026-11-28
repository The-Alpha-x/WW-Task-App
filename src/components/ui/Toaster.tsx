"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

type Listener = (toasts: ToastItem[]) => void;

const TOAST_DURATION_MS = 4000;
let nextId = 1;
let store: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener(store);
  }
}

function dismissToast(id: number) {
  store = store.filter((item) => item.id !== id);
  emit();
}

function pushToast(variant: ToastVariant, title: string, description?: string) {
  const id = nextId++;
  store = [...store.slice(-2), { id, variant, title, description }];
  emit();
  if (typeof window !== "undefined") {
    window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
  }
}

export const toast = {
  success: (title: string, description?: string) =>
    pushToast("success", title, description),
  error: (title: string, description?: string) =>
    pushToast("error", title, description),
};

/**
 * Compact Apple-style dark frosted-glass toast viewport anchored to the side
 * (top-right on phones, bottom-right on larger screens).
 */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listeners.add(setItems);
    setItems(store);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  // Modals use native <dialog>.showModal(), which renders in the browser's
  // top layer above any z-index. Using popover="manual" and re-promoting on
  // toast updates keeps Toaster at the very top of the top-layer stack.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof el.showPopover !== "function") return;
    if (items.length > 0) {
      try {
        if (el.matches(":popover-open")) {
          el.hidePopover();
        }
        el.showPopover();
      } catch {
        // Ignore if element is disconnected or popover is unsupported.
      }
    }
  }, [items]);

  const handleExitComplete = useCallback(() => {
    if (items.length > 0) return;
    const el = containerRef.current;
    if (!el || typeof el.hidePopover !== "function") return;
    try {
      if (el.matches(":popover-open")) {
        el.hidePopover();
      }
    } catch {
      // Ignore if element is disconnected.
    }
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      popover="manual"
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-auto right-[calc(0.75rem+env(safe-area-inset-right,0px))] top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-50 m-0 flex w-full max-w-[270px] flex-col items-end gap-2 overflow-visible border-0 bg-transparent p-0 sm:bottom-5 sm:right-5 sm:top-auto sm:max-w-[290px]"
    >
      <AnimatePresence initial={false} onExitComplete={handleExitComplete}>
        {items.map((item) => {
          const isError = item.variant === "error";
          return (
            <motion.div
              key={item.id}
              layout={!reduce}
              role={isError ? "alert" : "status"}
              initial={
                reduce ? { opacity: 0 } : { opacity: 0, x: 20, scale: 0.96 }
              }
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={
                reduce ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.96 }
              }
              transition={{
                duration: reduce ? 0.15 : 0.26,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                backdropFilter: "blur(24px) saturate(180%)",
              }}
              className={cn(
                "pointer-events-auto flex w-full items-center gap-3 rounded-2xl bg-glass/90 px-3 py-3 text-on-dark shadow-glass",
                isError
                  ? "border border-danger/35"
                  : "border border-glass-border/10",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  isError ? "bg-danger/20 text-danger" : "bg-lime/20 text-lime",
                )}
              >
                {isError ? (
                  <AlertCircle size={13} strokeWidth={2.25} />
                ) : (
                  <Check size={13} strokeWidth={2.5} />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold leading-snug text-on-dark">
                  {item.title}
                </p>
                {item.description && (
                  <p className="truncate text-xs font-medium text-on-dark-muted">
                    {item.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(item.id)}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-on-dark-muted transition-colors hover:bg-surface-raised/80 hover:text-on-dark"
              >
                <X aria-hidden="true" size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
