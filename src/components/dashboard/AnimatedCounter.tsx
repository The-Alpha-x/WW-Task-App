"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/cn";

export interface AnimatedCounterProps {
  /** Target number to animate to. */
  value: number;
  /** Additional Tailwind classes on the wrapper `<span>`. */
  className?: string;
  /** Animation duration in seconds. Defaults to 1.2. */
  duration?: number;
}

/**
 * Rolls a number up from 0 to `value` on first appearance using
 * Framer Motion spring. Respects `prefers-reduced-motion`.
 */
export function AnimatedCounter({
  value,
  className,
  duration = 1.2,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (latest) => Math.round(latest));

  useEffect(() => {
    if (!isInView) return;
    if (reduce) {
      motionVal.set(value);
      return;
    }
    const controls = animate(motionVal, value, {
      duration,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [isInView, value, reduce, motionVal, duration]);

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {rounded}
    </motion.span>
  );
}
