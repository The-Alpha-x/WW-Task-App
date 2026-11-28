"use client";

import { motion, useReducedMotion } from "framer-motion";

export interface DashboardGreetingProps {
  userName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Big typographic greeting: "Good morning, <first name>"
 * Fades + slides in on mount.
 */
export function DashboardGreeting({ userName }: DashboardGreetingProps) {
  const reduce = useReducedMotion();
  const firstName = userName.trim().split(/\s+/)[0] ?? userName;

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-2"
    >
      <h1 className="type-display-xl text-on-dark">
        {getGreeting()},
      </h1>
      {/* Volt highlighter: dark text on lime, identical in both themes. */}
      <p className="type-display-xl max-w-full">
        <span className="inline-block max-w-full break-words rounded-md bg-lime px-3 py-0.5 text-ink">
          {firstName}
        </span>
      </p>
    </motion.header>
  );
}
