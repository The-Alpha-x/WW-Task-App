"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  Target,
  TargetAndTransition,
  useReducedMotion,
} from "framer-motion";

type Props = {
  /** Status lines that cycle while loading. Pass one string to keep it fixed. */
  messages?: string[];
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_SLIDE = [0.65, 0, 0.35, 1] as const;
const SLIDE_SECONDS = 1.8;

/** One lime / pink / blue segment sweeping across the track. */
const SEGMENTS = [
  { color: "bg-lime", width: "38%", delay: 0, opacity: 1 },
  { color: "bg-pink", width: "7%", delay: 0.1, opacity: 0.9 },
  { color: "bg-blue", width: "4%", delay: 0.2, opacity: 0.9 },
] as const;

const LINES = ["WITCH-", "WOOFIE"] as const;

export function LoaderScreen({ messages = ["Loading your workspace"] }: Props) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce || messages.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % messages.length), 1800);
    return () => clearInterval(id);
  }, [messages.length, reduce]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="loader-text fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-on-dark"
    >
      <div className="flex w-fit flex-col items-start">
        {/* logo mark: lime tile, check draws in */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="grid size-[52px] place-items-center rounded-[16px] bg-lime"
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className="size-8"
          >
            <motion.path
              d="M8.5 16.5 l5 5 10-11.5"
              stroke="rgb(var(--color-ink))"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={
                reduce ? false : ({ pathLength: 0 } as unknown as Target)
              }
              animate={{ pathLength: 1 } as unknown as TargetAndTransition}
              transition={{ duration: 0.45, delay: 0.3, ease: EASE_OUT }}
            />
          </svg>
        </motion.div>

        {/* oversized wordmark, each line rises out of a mask */}
        <p className="mt-6 font-display text-[clamp(4.25rem,23vw,10.5rem)] font-extrabold uppercase leading-[0.88] tracking-tighter">
          {LINES.map((line, n) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={reduce ? { opacity: 0 } : { y: "105%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{
                  duration: 0.7,
                  delay: 0.15 + n * 0.09,
                  ease: EASE_OUT,
                }}
              >
                {line}
                {n === LINES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="ml-[0.05em] inline-block size-[0.14em] bg-lime"
                  />
                )}
              </motion.span>
            </span>
          ))}
        </p>

        {/* slim indeterminate indicator: lime leads, pink and blue trail */}
        <motion.div
          aria-hidden="true"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="relative mt-8 h-[3px] w-full overflow-hidden rounded-full bg-foreground/10"
        >
          {reduce ? (
            <div className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-lime" />
          ) : (
            SEGMENTS.map((s) => (
              <motion.div
                key={s.color}
                initial={{ x: "-45%" }}
                animate={{ x: "105%" }}
                transition={{
                  duration: SLIDE_SECONDS,
                  delay: s.delay,
                  repeat: Infinity,
                  ease: EASE_SLIDE,
                }}
                className="absolute inset-0"
              >
                <div
                  className={`h-full rounded-full ${s.color}`}
                  style={{ width: s.width, opacity: s.opacity }}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* status message: fixed height so cycling never shifts layout */}
        <div className="loader-text-muted mt-4 h-5 text-sm text-on-dark-muted">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={messages[i]}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="block"
            >
              {messages[i]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="loader-text-muted absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-2xs font-semibold uppercase tracking-[0.2em] text-on-dark-muted"
      >
        Make every day count.
      </motion.p>
    </motion.div>
  );
}
