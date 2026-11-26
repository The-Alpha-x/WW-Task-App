"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { NAV_ITEMS, isActivePath } from "@/lib/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { getUserDisplayName } from "@/lib/user-display";
import { cn } from "@/lib/cn";

const pillTransition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.8,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const userName = getUserDisplayName(user);
  const prefersReducedMotion = useReducedMotion();

  return (
    <aside className="app-sidebar hidden flex-col lg:flex" aria-label="Sidebar">
      {/* Primary Workspace Navigation */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto">
        <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-on-dark-muted/60">
          Workspace
        </p>
        <ul className="flex flex-col gap-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-4 rounded-md px-5 py-3 text-base font-semibold transition-colors duration-fast ease-standard",
                    active
                      ? "text-on-dark"
                      : "text-on-dark-muted hover:bg-on-dark/[0.05] hover:text-on-dark",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      aria-hidden="true"
                      transition={
                        prefersReducedMotion ? { duration: 0 } : pillTransition
                      }
                      className="absolute inset-0 -z-10 rounded-md bg-on-dark/[0.1] ring-1 ring-glass-border/10"
                    />
                  )}
                  <Icon
                    aria-hidden="true"
                    size={22}
                    strokeWidth={active ? 2.25 : 1.85}
                    className={active ? "text-lime" : "text-on-dark-muted"}
                  />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-md px-5 py-3 text-left text-base font-semibold text-on-dark-muted transition-colors duration-fast ease-standard hover:bg-on-dark/[0.05] hover:text-on-dark"
            >
              <Bell aria-hidden="true" size={22} strokeWidth={1.85} />
              <span>Notifications</span>
              <span
                aria-hidden="true"
                className="ml-auto h-3 w-3 rounded-full bg-lime shadow-lime-pill"
              />
              <span className="sr-only">Unread notifications</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Account Footer */}
      <footer className="mt-auto border-t border-glass-border/10 pt-5">
        <div className="flex min-w-0 items-center gap-3 rounded-md bg-on-dark/[0.04] p-3 ring-1 ring-glass-border/[0.06]">
          <Avatar name={userName} src={user?.photoURL} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-on-dark">
              {userName}
            </p>
            {user?.email && (
              <p className="truncate text-xs text-on-dark-muted/75">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <SignOutButton className="mt-3" />
      </footer>
    </aside>
  );
}
