"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * The glass task tile with a witch hat, paw badge and glowing orbit ring.
 * Entrance: tile drops in -> ring draws -> sparkles -> badge pops -> hat wiggles.
 * Idle: tile floats, ring pulses. Everything is static when reduced motion is on.
 */
export function HeroIllustration({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  const spring = (delay: number): Transition =>
    reduce
      ? { duration: 0 }
      : { type: "spring", stiffness: 120, damping: 13, delay };

  const draw = (delay: number): Transition =>
    reduce ? { duration: 0 } : { duration: 1.1, delay, ease: EASE_OUT };

  const fillBox = { transformBox: "fill-box" as const, transformOrigin: "50% 50%" };

  return (
    <svg
      viewBox="0 0 390 350"
      fill="none"
      overflow="visible"
      role="img"
      aria-label="A shared task list tile with a witch hat and a paw badge, circled by a glowing ring"
      className={className}
    >
      <defs>
        <linearGradient id="ww-ring" x1="45" y1="0" x2="345" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgb(var(--color-lime))" stopOpacity="0.35" />
          <stop offset="0.35" stopColor="rgb(var(--color-lime))" stopOpacity="1" />
          <stop offset="1" stopColor="rgb(var(--color-lime))" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="ww-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--color-neutral-750))" />
          <stop offset="1" stopColor="rgb(var(--color-neutral-950))" />
        </linearGradient>
        <filter id="ww-glow" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* sparkles */}
      <motion.path
        d="M78 70l17 11"
        stroke="rgb(var(--color-lime))"
        strokeWidth={6}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        initial={reduce ? false : { strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 0 }}
        transition={draw(1.0)}
      />
      <motion.path
        d="M110 48l7 20"
        stroke="rgb(var(--color-lime))"
        strokeWidth={6}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        initial={reduce ? false : { strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 0 }}
        transition={draw(1.15)}
      />

      {/* ground shadow */}
      <ellipse cx="195" cy="318" rx="110" ry="14" fill="rgb(var(--color-black))" opacity="0.55" />

      {/* orbit: back half */}
      <motion.path
        d="M45 205 A150 46 0 0 1 345 205"
        transform="rotate(-14 195 205)"
        stroke="rgb(var(--color-lime))"
        strokeOpacity={0.35}
        strokeWidth={4}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        initial={reduce ? false : { strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 0 }}
        transition={draw(0.45)}
      />

      {/* tile: entrance wrapper -> float wrapper -> static tilt */}
      <motion.g
        style={fillBox}
        initial={reduce ? false : { opacity: 0, y: -60, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring(0.1)}
      >
        <motion.g
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <g transform="translate(195 190) rotate(-12)">
            <rect x="-80" y="-80" width="160" height="160" rx="42" fill="url(#ww-tile)" stroke="rgb(var(--color-white))" strokeOpacity="0.18" strokeWidth="1.5" />

            {/* row 1 */}
            <circle cx="-42" cy="-38" r="16" fill="rgb(var(--color-neutral-700))" stroke="rgb(var(--color-white))" strokeOpacity="0.2" />
            <path d="M-50 -38l6 6 10-11" stroke="rgb(var(--color-white))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="-14" y="-50" width="80" height="24" rx="12" fill="rgb(var(--color-neutral-800))" />

            {/* row 2 */}
            <circle cx="-42" cy="2" r="16" fill="rgb(var(--color-neutral-700))" stroke="rgb(var(--color-white))" strokeOpacity="0.2" />
            <path d="M-50 2l6 6 10-11" stroke="rgb(var(--color-white))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="-14" y="-10" width="80" height="24" rx="12" fill="rgb(var(--color-lime))" />

            {/* row 3: the two of you */}
            <circle cx="-44" cy="46" r="15" fill="rgb(var(--color-purple))" stroke="rgb(var(--color-neutral-850))" strokeWidth="3" />
            <circle cx="-26" cy="46" r="15" fill="rgb(var(--color-orange))" stroke="rgb(var(--color-neutral-850))" strokeWidth="3" />
            <rect x="-2" y="40" width="54" height="12" rx="6" fill="rgb(var(--color-neutral-800))" />

            {/* witch hat, wiggles once after the entrance */}
            <motion.g
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
              animate={reduce ? undefined : { rotate: [0, -10, 8, -4, 0] }}
              transition={{ delay: 1.5, duration: 0.9, ease: "easeInOut" }}
            >
              <g transform="translate(-62 -78) rotate(-24)">
                <ellipse cx="0" cy="0" rx="30" ry="8" fill="rgb(var(--color-purple))" />
                <path d="M-16 -2 C -9 -22 -3 -38 8 -50 C 10 -43 17 -41 22 -37 C 17 -25 16 -13 16 -2 Z" fill="rgb(var(--color-purple))" />
                <path d="M-15 -8 L 16 -8 L 16 -2 L -16 -2 Z" fill="rgb(var(--color-lime))" />
              </g>
            </motion.g>
          </g>
        </motion.g>
      </motion.g>

      {/* orbit: front half, passes over the tile */}
      <motion.path
        d="M45 205 A150 46 0 0 0 345 205"
        transform="rotate(-14 195 205)"
        stroke="url(#ww-ring)"
        strokeWidth={9}
        strokeLinecap="round"
        filter="url(#ww-glow)"
        pathLength={1}
        strokeDasharray={1}
        initial={reduce ? false : { strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 0, opacity: reduce ? 1 : [1, 0.7, 1] }}
        transition={{
          strokeDashoffset: draw(0.5),
          opacity: { duration: 3.2, repeat: Infinity, delay: 2, ease: "easeInOut" },
        }}
      />

      {/* paw badge */}
      <g transform="translate(312 70) rotate(8)">
        <motion.g
          style={fillBox}
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring(1.2)}
        >
          <rect x="-30" y="-30" width="60" height="60" rx="18" fill="rgb(var(--color-neutral-900))" stroke="rgb(var(--color-white))" strokeOpacity="0.2" strokeWidth="1.5" />
          <ellipse cx="0" cy="7" rx="10" ry="8" fill="rgb(var(--color-white))" />
          <circle cx="-11" cy="-5" r="4" fill="rgb(var(--color-white))" />
          <circle cx="-4" cy="-12" r="4" fill="rgb(var(--color-white))" />
          <circle cx="4" cy="-12" r="4" fill="rgb(var(--color-white))" />
          <circle cx="11" cy="-5" r="4" fill="rgb(var(--color-white))" />
          <motion.circle
            cx="20"
            cy="-20"
            r="7"
            fill="rgb(var(--color-lime))"
            stroke="rgb(var(--color-neutral-900))"
            strokeWidth="2"
            style={fillBox}
            animate={reduce ? undefined : { scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </motion.g>
      </g>
    </svg>
  );
}
