"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/cn";

interface SignOutButtonProps {
  iconOnly?: boolean;
  className?: string;
}

export function SignOutButton({
  iconOnly = false,
  className,
}: SignOutButtonProps) {
  const { signOutUser } = useAuth();
  const [error, setError] = useState("");

  const handleSignOut = async () => {
    setError("");
    try {
      await signOutUser();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not sign out.",
      );
    }
  };

  return (
    <div className={iconOnly ? "relative flex justify-center" : cn("mt-2", className)}>
      <button
        type="button"
        aria-label={iconOnly ? "Sign out" : undefined}
        onClick={handleSignOut}
        className={
          iconOnly
            ? "flex h-12 w-12 items-center justify-center rounded-full text-on-dark-muted transition-all duration-fast ease-standard hover:bg-danger/15 hover:text-danger active:scale-95"
            : "flex w-full items-center justify-center gap-3 rounded-md border border-glass-border/10 bg-on-dark/[0.04] px-5 py-3 text-sm font-semibold text-on-dark-muted transition-all duration-fast ease-standard hover:border-danger/25 hover:bg-danger/15 hover:text-danger active:scale-[0.98]"
        }
      >
        <LogOut aria-hidden="true" size={iconOnly ? 20 : 18} strokeWidth={1.85} />
        {!iconOnly && <span>Sign out</span>}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-2 text-center text-xs text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
