"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export interface CircularProgressBarProps {
  /** Number displayed in the center of the ring. */
  number?: number;
  /** Target fill percentage (0-100). */
  percent?: number;
  /** Stroke width in SVG viewBox units (0-100). */
  strokeWidth?: number;
  /** Progress arc color (CSS color or token variable). */
  barColor?: string;
  /** Background track color (CSS color or token variable). */
  trackColor?: string;
  /** Center number color (CSS color or token variable). */
  numberColor?: string;
  /** Typography styles applied to the center number. */
  font?: CSSProperties;
  /** Whether to animate the ring and number on mount/change. */
  animate?: boolean;
  /** Whether to count the displayed number up alongside the ring. */
  animateNumber?: boolean;
  /** Optional suffix rendered next to the number (e.g. "%"). */
  numberSuffix?: string;
  /** Animation duration in seconds. */
  duration?: number;
  /** Starting angle in degrees (0 = top 12 o'clock). */
  startAngle?: number;
  /** Sweep direction. */
  direction?: "clockwise" | "counterclockwise";
  /** Optional secondary label below the number. */
  label?: string;
  /** Typography styles applied to `label`. */
  labelFont?: CSSProperties;
  /** Label color (CSS color or token variable). */
  labelColor?: string;
  /** Optional container styles. */
  style?: CSSProperties;
  className?: string;
}

/**
 * Animated circular progress bar ported from Framer CircularProgressBar
 * (CircularProgressBar-yWcI.js@OEu2HvRu0C6BC5MPW3pA) to work natively with
 * React 19, Framer Motion, and the app's CSS design tokens.
 */
export function CircularProgressBar({
  number = 0,
  percent = 0,
  strokeWidth = 10,
  barColor = "rgb(var(--color-lime))",
  trackColor = "rgb(var(--color-surface-raised))",
  numberColor = "rgb(var(--color-on-dark))",
  font,
  animate = true,
  animateNumber = true,
  numberSuffix,
  duration = 1.2,
  startAngle = 0,
  direction = "clockwise",
  label,
  labelFont,
  labelColor = "rgb(var(--color-on-dark-muted))",
  style,
  className,
}: CircularProgressBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && !reduceMotion;

  const size = 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const [progress, setProgress] = useState(shouldAnimate ? 0 : clampedPercent);
  const [displayNumber, setDisplayNumber] = useState(
    shouldAnimate && animateNumber ? 0 : number,
  );

  const requestRef = useRef<number | undefined>(undefined);
  const startTime = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(containerRef, { once: true, margin: "-10%" });

  const rotation = startAngle - 90;
  const directionSign = direction === "counterclockwise" ? -1 : 1;
  const dashOffset = directionSign * circumference * (1 - progress / 100);

  useEffect(() => {
    if (!shouldAnimate) {
      startTransition(() => {
        setProgress(clampedPercent);
        setDisplayNumber(number);
      });
      return;
    }

    if (!inView) return;

    if (requestRef.current !== undefined) {
      cancelAnimationFrame(requestRef.current);
    }
    startTime.current = undefined;

    function animateStep(ts: number) {
      if (startTime.current === undefined) startTime.current = ts;
      const elapsed = (ts - startTime.current) / 1000;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const nextProgress = clampedPercent * eased;
      const nextNumber = animateNumber ? Math.round(number * eased) : number;

      startTransition(() => {
        setProgress(nextProgress);
        setDisplayNumber(nextNumber);
      });

      if (t < 1) {
        requestRef.current = requestAnimationFrame(animateStep);
      } else {
        startTransition(() => {
          setProgress(clampedPercent);
          setDisplayNumber(number);
        });
      }
    }

    requestRef.current = requestAnimationFrame(animateStep);
    return () => {
      if (requestRef.current !== undefined) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [clampedPercent, number, shouldAnimate, animateNumber, duration, inView]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ...style,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `rotate(${rotation}deg)`,
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <circle
          cx={50}
          cy={50}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={50}
          cy={50}
          r={radius}
          stroke={barColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: numberColor,
            display: "inline-block",
            width: "100%",
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
            fontSize: "28px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: "1em",
            ...font,
          }}
        >
          {displayNumber}
          {numberSuffix}
        </span>
        {label && (
          <span
            style={{
              color: labelColor,
              marginTop: 4,
              width: "100%",
              textAlign: "center",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.02em",
              lineHeight: "1.2em",
              ...labelFont,
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
