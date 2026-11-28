import { cn } from "@/lib/cn";

/** Shared look for Input and Textarea so the two never drift apart. */
export type FieldTone = "dark" | "light";

/**
 * Surface, text and placeholder colours per tone.
 * `dark` is the app's default field: filled with --color-input, which sits one
 * step INSET from the card it is placed on (darker in dark mode, a faint tint
 * in light mode), so a field reads as a well rather than a floating box.
 */
const toneClasses: Record<FieldTone, string> = {
  dark: "bg-input text-on-dark placeholder:text-subtle-text",
  light: "bg-card-muted text-ink placeholder:text-ink-muted",
};

/**
 * Border + focus per tone. Focus is a 1px border swap plus a 1px INSET ring, so
 * the highlight never gets clipped by overflow-hidden wrappers (date inputs).
 * Error replaces it entirely (no conflicting classes).
 */
const borderClasses: Record<FieldTone, string> = {
  dark: "border-field hover:border-on-dark-muted/60 focus:border-ring focus:ring-1 focus:ring-inset focus:ring-ring",
  light: "border-field hover:border-ink-muted/60 focus:border-ink focus:ring-1 focus:ring-inset focus:ring-ink",
};

const errorBorderClasses =
  "border-danger focus:border-danger focus:ring-1 focus:ring-inset focus:ring-danger";

const labelToneClasses: Record<FieldTone, string> = {
  dark: "text-on-dark",
  light: "text-ink",
};

export function fieldClasses(tone: FieldTone, invalid: boolean, extra?: string): string {
  return cn(
    "block w-full min-w-0 max-w-full rounded-md border px-5 text-base font-medium outline-none transition-[border-color,box-shadow,background-color] duration-base ease-standard",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-field",
    toneClasses[tone],
    invalid ? errorBorderClasses : borderClasses[tone],
    extra,
  );
}

export function labelClasses(tone: FieldTone): string {
  return cn("type-label", labelToneClasses[tone]);
}

export function messageClasses(): string {
  return "text-sm font-semibold text-danger";
}
