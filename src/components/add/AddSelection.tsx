"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { ADD_OPTIONS } from "@/lib/navigation";
import { AddOptionCard } from "./AddOptionCard";

/**
 * Creation hub matching the /activities 3-card aesthetic: calm editorial header,
 * vertical scroll on mobile, and a balanced 3-card grid on larger screens.
 */
export function AddSelection() {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.08,
        delayChildren: reduce ? 0 : 0.04,
      },
    },
  };

  return (
    <PageContainer className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="type-display-lg text-on-dark">Add New</h1>
          <p className="max-w-2xl text-sm font-medium text-on-dark-muted">
            Choose what you would like to create.
          </p>
        </div>
      </header>

      <motion.section
        aria-label="Add options"
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {ADD_OPTIONS.map((option, index) => (
          <AddOptionCard
            key={option.id}
            option={option}
            index={index}
            total={ADD_OPTIONS.length}
          />
        ))}
      </motion.section>
    </PageContainer>
  );
}
