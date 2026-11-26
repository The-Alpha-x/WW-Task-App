import type { Config } from "tailwindcss";

/**
 * Tailwind is a thin mapping layer over the CSS variables defined in
 * src/styles/tokens.css. Change values there, never here.
 * Colors are stored as space-separated RGB channels so opacity modifiers
 * (e.g. bg-lime/20) keep working.
 */
const color = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    // Mobile-first breakpoints. The reference is a phone UI; larger
    // breakpoints are for later responsive work.
    screens: {
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      background: color("background"),
      surface: color("surface"),
      "surface-raised": color("surface-raised"),
      glass: color("glass"),
      "glass-border": color("glass-border"),
      lime: color("lime"),
      purple: color("purple"),
      orange: color("orange"),
            teal: color("teal"),
      blue: color("blue"),
      sage: color("sage"),
      danger: color("danger"),
      card: color("card"),
      "card-muted": color("card-muted"),
      border: color("border"),
      ink: color("ink"),
      "ink-muted": color("ink-muted"),
      "on-dark": color("on-dark"),
      "on-dark-muted": color("on-dark-muted"),
    },
    fontFamily: {
      sans: ["var(--font-nunito)", "ui-rounded", "system-ui", "sans-serif"],
    },
    fontSize: {
      "2xs": ["var(--text-2xs)", { lineHeight: "1" }],
      xs: ["var(--text-xs)", { lineHeight: "var(--leading-snug)" }],
      sm: ["var(--text-sm)", { lineHeight: "var(--leading-snug)" }],
      base: ["var(--text-base)", { lineHeight: "var(--leading-normal)" }],
      lg: ["var(--text-lg)", { lineHeight: "var(--leading-snug)" }],
      xl: ["var(--text-xl)", { lineHeight: "var(--leading-tight)" }],
      "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-tight)" }],
      "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-tight)" }],
      stat: ["var(--text-stat)", { lineHeight: "1" }],
    },
    fontWeight: {
      regular: "var(--weight-regular)",
      medium: "var(--weight-medium)",
      semibold: "var(--weight-semibold)",
      bold: "var(--weight-bold)",
    },
    spacing: {
      0: "0px",
      px: "1px",
      1: "var(--space-1)",
      2: "var(--space-2)",
      3: "var(--space-3)",
      4: "var(--space-4)",
      5: "var(--space-5)",
      6: "var(--space-6)",
      8: "var(--space-8)",
      10: "var(--space-10)",
      12: "var(--space-12)",
      16: "var(--space-16)",
    },
    borderRadius: {
      none: "0px",
      sm: "var(--radius-sm)",
      md: "var(--radius-md)",
      lg: "var(--radius-lg)",
      xl: "var(--radius-xl)",
      "2xl": "var(--radius-2xl)",
      full: "var(--radius-full)",
    },
    boxShadow: {
      none: "none",
      glow: "var(--shadow-glow)",
      glass: "var(--shadow-glass)",
      "lime-pill": "var(--shadow-lime-pill)",
    },
    transitionDuration: {
      fast: "var(--duration-fast)",
      base: "var(--duration-base)",
      slow: "var(--duration-slow)",
    },
    transitionTimingFunction: {
      standard: "var(--ease-standard)",
      emphasized: "var(--ease-emphasized)",
    },
    extend: {},
  },
  plugins: [],
};

export default config;
