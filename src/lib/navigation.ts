import {
  HeartHandshake,
  House,
  LayoutDashboard,
  CalendarRange,
  Logs,
  BookHeart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Icon used in the desktop sidebar. */
  icon: LucideIcon;
  /** Icon used in the mobile bottom navigation (matches the reference). */
  bottomIcon: LucideIcon;
}

/** App routes shared by Sidebar and BottomNavigation. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, bottomIcon: House },
  { href: "/tasks", label: "Tasks", icon: Logs, bottomIcon: Logs },
  {
    href: "/activities",
    label: "Activities",
    icon: HeartHandshake,
    bottomIcon: HeartHandshake,
  },
  {
    href: "/events",
    label: "Events",
    icon: CalendarRange,
    bottomIcon: CalendarRange,
  },
  { href: "/memories", label: "Memories", icon: BookHeart, bottomIcon: BookHeart },
];

export const ADD_HREF = "/add";
export const ADD_TASK_HREF = "/tasks/add";
export const ADD_EVENT_HREF = "/events/add";
export const ADD_MEMORY_HREF = "/memories/add";
export const EVENTS_HREF = "/events";
export const MEMORIES_HREF = "/memories";
export const LISTS_HREF = "/activities/lists";
export const ADD_LIST_HREF = "/activities/lists/add";

/** Selection page plus every creation route, so the Add button reads as active on all of them. */
const ADD_PATHS = [
  ADD_HREF,
  ADD_TASK_HREF,
  ADD_EVENT_HREF,
  ADD_MEMORY_HREF,
] as const;

export function isAddPath(pathname: string): boolean {
  return ADD_PATHS.some((path) => pathname === path);
}

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getEventHref(eventId: string): string {
  return `${EVENTS_HREF}?event=${encodeURIComponent(eventId)}`;
}

export function getMemoryHref(memoryId: string): string {
  return `${MEMORIES_HREF}?memory=${encodeURIComponent(memoryId)}`;
}

export type AddOptionId = "task" | "event" | "memory";

export interface AddOption {
  id: AddOptionId;
  href: string;
  title: string;
  description: string;
  image: string;
}

/** Order matters: it is the visual and the stagger order. */
export const ADD_OPTIONS: readonly AddOption[] = [
  {
    id: "task",
    href: ADD_TASK_HREF,
    title: "Task",
    description: "Plan tasks and things to accomplish.",
    image: "/images/task-card.webp",
  },
  {
    id: "event",
    href: ADD_EVENT_HREF,
    title: "Event",
    description: "Keep track of upcoming plans and special dates.",
    image: "/images/events-card.webp",
  },
  {
    id: "memory",
    href: ADD_MEMORY_HREF,
    title: "Memory",
    description: "Save moments worth remembering.",
    image: "/images/memories-card.webp",
  },
];
