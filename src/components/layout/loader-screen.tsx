"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type TargetAndTransition,
} from "framer-motion";

type Props = {
  /** Status lines that cycle while loading. Pass one string to keep it fixed. */
  messages?: string[];
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const CYCLE = 3.6; // seconds for one "complete three tasks" loop

/* A dot that travels around the tilted orbit ring (precomputed keyframes). */
const STEPS = 24;
const TILT = (-14 * Math.PI) / 180;
const ORBIT = Array.from({ length: STEPS + 1 }, (_, k) => {
  const t = (k / STEPS) * Math.PI * 2;
  const x = 100 * Math.cos(t);
  const y = 30 * Math.sin(t);
  return {
    cx: 110 + x * Math.cos(TILT) - y * Math.sin(TILT),
    cy: 104 + x * Math.sin(TILT) + y * Math.cos(TILT),
    opacity: Math.sin(t) >= 0 ? 1 : 0.25, // passes behind the tile on the back half
  };
});

const ROWS = [-28, 0, 28];
const LAST_ROW = ROWS.length - 1;

export function LoaderScreen({ messages = ["Loading your workspace"] }: Props) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce || messages.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % messages.length), 1800);
    return () => clearInterval(id);
  }, [messages.length, reduce]);

  const loop = {
    duration: CYCLE,
    repeat: Infinity,
    ease: "easeInOut" as const,
  };

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-ww-bg font-brand text-white"
    >
      {/* faint background arcs, same as the login screen */}
      <svg
        aria-hidden="true"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        className="pointer-events-none absolute inset-0 size-full"
      >
        <path
          d="M345 0 C 350 90 320 150 220 190"
          stroke="#D9F55B"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
        <path
          d="M390 40 C 360 120 300 150 230 160"
          stroke="#D9F55B"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
        <path
          d="M0 800 C 120 790 260 760 390 640"
          stroke="#D9F55B"
          strokeOpacity="0.22"
          strokeWidth="1"
        />
      </svg>

      {/* breathing glow */}
      <motion.div
        aria-hidden="true"
        animate={
          reduce
            ? undefined
            : { opacity: [0.7, 1, 0.7], scale: [0.95, 1.05, 0.95] }
        }
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute size-[420px] rounded-full bg-[radial-gradient(circle,rgba(217,245,91,0.18),transparent_70%)]"
      />

      <svg
        viewBox="0 0 220 200"
        fill="none"
        aria-hidden="true"
        overflow="visible"
        className="relative w-[260px] sm:w-[300px]"
      >
        <defs>
          <linearGradient
            id="ld-ring"
            x1="10"
            y1="0"
            x2="210"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#D9F55B" stopOpacity="0.35" />
            <stop offset="0.4" stopColor="#D9F55B" />
            <stop offset="1" stopColor="#D9F55B" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="ld-tile" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#34363A" />
            <stop offset="1" stopColor="#121314" />
          </linearGradient>
          <filter id="ld-glow" x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="110" cy="182" rx="62" ry="8" fill="#000" opacity="0.55" />

        {/* ring: back half */}
        <path
          d="M10 104 A100 30 0 0 1 210 104"
          transform="rotate(-14 110 104)"
          stroke="#D9F55B"
          strokeOpacity={0.3}
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* paw badge, floats out of phase with the tile */}
        <motion.g
          animate={reduce ? undefined : { y: [0, 5, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6,
          }}
        >
          <g transform="translate(194 38) rotate(8)">
            <rect
              x="-21"
              y="-21"
              width="42"
              height="42"
              rx="13"
              fill="url(#ld-tile)"
              stroke="#fff"
              strokeOpacity="0.18"
              strokeWidth="1.2"
            />
            <g fill="#fff">
              <ellipse cx="0" cy="5" rx="6.5" ry="5.2" />
              <ellipse
                cx="-8.5"
                cy="-2"
                rx="2.7"
                ry="3.5"
                transform="rotate(-22 -8.5 -2)"
              />
              <ellipse
                cx="-3"
                cy="-7.5"
                rx="2.7"
                ry="3.5"
                transform="rotate(-6 -3 -7.5)"
              />
              <ellipse
                cx="3"
                cy="-7.5"
                rx="2.7"
                ry="3.5"
                transform="rotate(6 3 -7.5)"
              />
              <ellipse
                cx="8.5"
                cy="-2"
                rx="2.7"
                ry="3.5"
                transform="rotate(22 8.5 -2)"
              />
            </g>
            <motion.circle
              cx="19"
              cy="-19"
              r="5"
              fill="#D9F55B"
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              animate={reduce ? undefined : { scale: [1, 1.25, 1] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </g>
        </motion.g>

        {/* tile */}
        <motion.g
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <g transform="translate(110 98) rotate(-12)">
            <rect
              x="-55"
              y="-55"
              width="110"
              height="110"
              rx="30"
              fill="url(#ld-tile)"
              stroke="#fff"
              strokeOpacity="0.18"
              strokeWidth="1.2"
            />

            {ROWS.map((y, row) => {
              const t0 = row * 0.22;
              const times = [0, t0, t0 + 0.14, 0.85, 1];
              const isLast = row === LAST_ROW;
              return (
                <g key={y}>
                  {isLast ? (
                    /* last row shows the assignees, like the login artwork */
                    <g>
                      <circle cx="-30" cy={y} r="10" fill="#B57BF5" />
                      <motion.circle
                        cx="-19"
                        cy={y}
                        r="10"
                        fill="#FF8A1F"
                        stroke="#121314"
                        strokeWidth="2"
                        style={{
                          transformBox: "fill-box",
                          transformOrigin: "50% 50%",
                        }}
                        animate={
                          reduce ? undefined : { scale: [1, 1, 1.18, 1, 1] }
                        }
                        transition={{
                          ...loop,
                          times: [0, t0 + 0.14, t0 + 0.2, t0 + 0.28, 1],
                        }}
                      />
                    </g>
                  ) : (
                    <>
                      <circle
                        cx="-28"
                        cy={y}
                        r="11"
                        fill="#3A3C3F"
                        stroke="#fff"
                        strokeOpacity="0.2"
                      />
                      <motion.path
                        d={`M-33 ${y} l4.5 4.5 7.5-8.5`}
                        stroke="#fff"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={false}
                        animate={
                          (reduce
                            ? { pathLength: 1 }
                            : {
                                pathLength: [0, 0, 1, 1, 0],
                              }) as unknown as TargetAndTransition
                        }
                        transition={{ ...loop, times }}
                      />
                    </>
                  )}
                  <rect
                    x="-8"
                    y={y - 8}
                    width="52"
                    height="16"
                    rx="8"
                    fill="#2A2C2E"
                  />
                  <motion.rect
                    x="-8"
                    y={y - 8}
                    width="52"
                    height="16"
                    rx="8"
                    fill="#D9F55B"
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: "0% 50%",
                    }}
                    initial={false}
                    animate={
                      reduce ? { scaleX: 1 } : { scaleX: [0, 0, 1, 1, 0] }
                    }
                    transition={{ ...loop, times }}
                  />
                </g>
              );
            })}

            {/* hat wiggles when the last task completes */}
            <motion.g
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
              animate={reduce ? undefined : { rotate: [0, 0, -9, 7, -3, 0] }}
              transition={{ ...loop, times: [0, 0.7, 0.76, 0.82, 0.88, 0.94] }}
            >
              <g transform="translate(-42 -54) rotate(-24) scale(0.7)">
                <ellipse cx="0" cy="0" rx="30" ry="8" fill="#B57BF5" />
                <path
                  d="M-16 -2 C -9 -22 -3 -38 8 -50 C 10 -43 17 -41 22 -37 C 17 -25 16 -13 16 -2 Z"
                  fill="#B57BF5"
                />
                <path d="M-15 -8 L 16 -8 L 16 -2 L -16 -2 Z" fill="#D9F55B" />
              </g>
            </motion.g>

            {/* sparkle dashes beside the hat, flash with the wiggle */}
            <motion.g
              stroke="#D9F55B"
              strokeWidth="4"
              strokeLinecap="round"
              animate={
                reduce ? undefined : { opacity: [0.35, 0.35, 1, 1, 0.35, 0.35] }
              }
              transition={{ ...loop, times: [0, 0.7, 0.76, 0.88, 0.94, 1] }}
            >
              <path d="M-76 -88 l9 5" />
              <path d="M-44 -104 l3 10" />
            </motion.g>
          </g>
        </motion.g>

        {/* ring: front half */}
        <path
          d="M10 104 A100 30 0 0 0 210 104"
          transform="rotate(-14 110 104)"
          stroke="url(#ld-ring)"
          strokeWidth={6}
          strokeLinecap="round"
          filter="url(#ld-glow)"
        />

        {/* dot travelling along the ring */}
        {!reduce && (
          <motion.circle
            r="5"
            fill="#D9F55B"
            filter="url(#ld-glow)"
            animate={{
              cx: ORBIT.map((p) => p.cx),
              cy: ORBIT.map((p) => p.cy),
              opacity: ORBIT.map((p) => p.opacity),
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
        )}
      </svg>

      {/* wordmark: check logo + name, same as the login screen */}
      <div className="mt-6 flex items-center gap-3">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
          className="size-8"
        >
          <circle cx="16" cy="16" r="13" stroke="#D9F55B" strokeWidth="2.6" />
          <motion.path
            d="M10 16.5 l4.2 4.2 7.8-9"
            stroke="#D9F55B"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={
              (reduce
                ? { pathLength: 1 }
                : {
                    pathLength: [0, 1, 1, 0],
                  }) as unknown as TargetAndTransition
            }
            transition={{
              duration: CYCLE,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.25, 0.85, 1],
            }}
          />
        </svg>
        <p className="text-[28px] font-semibold tracking-tight">Witch-Woofie</p>
      </div>

      <div className="mt-2 h-6 text-base text-ww-muted">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={messages[i]}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="block"
          >
            {messages[i]}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
