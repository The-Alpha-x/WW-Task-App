"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoaderScreen } from "@/components/layout/loader-screen";
import { BottomNavigation } from "./BottomNavigation";
import { MobileTopBar } from "./MobileTopBar";
import { Sidebar } from "./Sidebar";

/**
 * Shared application frame.
 * < lg: content + floating bottom navigation.
 * >= lg: fixed sidebar + content.
 * Visibility and spacing are handled in globals.css (.app-*) so the
 * navigation can never overlap content.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isSignIn = pathname === "/sign-in";

  useEffect(() => {
    if (status === "signed-out" && !isSignIn) {
      router.replace("/sign-in");
    } else if (status === "signed-in" && isSignIn) {
      router.replace("/");
    }
  }, [isSignIn, router, status]);

  if (status === "loading") {
    return <LoaderScreen messages={["Checking your session"]} />;
  }

  if (status === "not-configured" && !isSignIn) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center text-on-dark">
        <p>
          Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* settings
          and restart the app.
        </p>
      </div>
    );
  }

  if (isSignIn) return status === "signed-in" ? null : <>{children}</>;
  if (status === "signed-out") return null;

  return (
    <div className="app-shell">
      <Sidebar />
      <MobileTopBar />
      <main id="main-content" className="app-main">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
