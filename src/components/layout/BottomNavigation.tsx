"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ADD_HREF, NAV_ITEMS, isActivePath, isAddPath } from "@/lib/navigation";
import { cn } from "@/lib/cn";

const ICON_SIZE = 22;

const tabTransition = {
  type: "spring",
  stiffness: 440,
  damping: 34,
  mass: 0.75,
} as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [dashboard, tasks, activities, events] = NAV_ITEMS;
  const addActive = isAddPath(pathname);

  const linkItem = (item: (typeof NAV_ITEMS)[number]) => {
    const active = isActivePath(pathname, item.href);
    const Icon = item.bottomIcon;
    return (
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-fast ease-standard active:scale-95",
          active ? "text-lime" : "text-on-dark-muted hover:text-on-dark",
        )}
      >
        {active && (
          <motion.span
            layoutId="bottom-nav-active-pill"
            aria-hidden="true"
            transition={prefersReducedMotion ? { duration: 0 } : tabTransition}
            className="absolute inset-0 -z-10 rounded-full bg-on-dark/[0.1] ring-1 ring-glass-border/10"
          />
        )}
        <Icon
          aria-hidden="true"
          size={ICON_SIZE}
          strokeWidth={active ? 2.25 : 1.75}
        />
      </Link>
    );
  };

  return (
    <div className="app-bottom-nav">
      <nav aria-label="Primary" className="app-bottom-nav__bar">
        <ul className="grid h-full grid-cols-5 place-items-center">
          <li>{dashboard && linkItem(dashboard)}</li>
          <li>{tasks && linkItem(tasks)}</li>
          <li>
            <Link
              href={ADD_HREF}
              aria-label="Add new"
              aria-current={addActive ? "page" : undefined}
              className={cn(
                "flex items-center justify-center rounded-full bg-lime text-ink transition-[transform,background-color] duration-fast ease-standard hover:bg-lime-soft active:scale-95",
                addActive && "ring-2 ring-on-dark/40",
              )}
              style={{
                width: "var(--size-add-button)",
                height: "var(--size-add-button)",
              }}
            >
              <Plus aria-hidden="true" size={26} strokeWidth={3} />
            </Link>
          </li>
          <li>{events && linkItem(events)}</li>
          <li>{activities && linkItem(activities)}</li>
        </ul>
      </nav>
    </div>
  );
}
