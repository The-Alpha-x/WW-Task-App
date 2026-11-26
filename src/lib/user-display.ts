import type { User } from "firebase/auth";

/** Name shown in greetings and the sidebar: display name, else email prefix. */
export function getUserDisplayName(user: User | null): string {
  return user?.displayName || user?.email?.split("@")[0] || "there";
}
