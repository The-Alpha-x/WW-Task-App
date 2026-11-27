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
      className="flex flex-col gap-1"
    >
      <h1 className="text-3xl font-bold tracking-tight text-on-dark md:text-[2.5rem] md:leading-tight">
        {getGreeting()},
      </h1>
      <p className="text-2xl font-bold text-lime md:text-3xl">
        {firstName}
      </p>
    </motion.header>
  );
}
