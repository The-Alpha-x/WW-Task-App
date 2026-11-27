"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationButton } from "@/components/ui/NotificationButton";
import { getUserDisplayName } from "@/lib/user-display";

/**
 * Fixed top-right overlay shown only on mobile (< lg).
 * Contains a notification bell and the signed-in user's avatar with a
 * dropdown submenu for logging out.
 * Hidden on desktop — the sidebar already shows those affordances.
 */
export function MobileTopBar() {
  const { user, signOutUser } = useAuth();
  const userName = getUserDisplayName(user);
  const reduceMotion = useReducedMotion();

  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      await signOutUser();
      setMenuOpen(false);
    } catch (cause) {
      setSignOutError(
        cause instanceof Error ? cause.message : "Could not sign out.",
      );
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      ref={containerRef}
      aria-label="Quick actions"
      className="fixed right-[calc(1rem+env(safe-area-inset-right,0px))] top-[calc(1rem+env(safe-area-inset-top,0px))] z-50 flex items-center gap-2 lg:hidden"
    >
      <NotificationButton className="h-10 w-10" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={`${userName} account menu`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="inline-flex h-10 w-10 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-surface-raised ring-1 ring-glass-border/15 transition-transform duration-fast ease-standard hover:ring-lime/50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          <Avatar src={user?.photoURL} name={userName} size="sm" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              role="menu"
              aria-label="Account options"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8, scale: 0.94 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -6, scale: 0.95 }
              }
              transition={
                reduceMotion
                  ? { duration: 0.1 }
                  : { type: "spring", stiffness: 460, damping: 32, mass: 0.7 }
              }
              className="absolute right-0 mt-3 w-48 origin-top-right overflow-hidden rounded-none bg-glass/80 p-2 shadow-glass ring-1 ring-glass-border/15 backdrop-blur-2xl saturate-150"
            >
              <div className="px-3 py-2">
                <p className="truncate text-[13px] font-semibold tracking-tight text-on-dark">
                  {userName}
                </p>
              </div>

              <div
                aria-hidden="true"
                className="mx-3 h-px bg-glass-border/10"
              />

              <button
                type="button"
                role="menuitem"
                disabled={signingOut}
                onClick={() => void handleSignOut()}
                className="mt-1 flex w-full items-center justify-between rounded-none px-3 py-2 text-left text-[13px] font-semibold text-danger transition-all duration-fast ease-standard hover:bg-danger/15 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              >
                <span>{signingOut ? "Logging out…" : "Log out"}</span>
                <LogOut aria-hidden="true" size={15} strokeWidth={2} />
              </button>

              {signOutError && (
                <p role="alert" className="px-3 py-2 text-xs text-danger">
                  {signOutError}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
