import { cn } from "@/lib/cn";

/** Shared look for Input and Textarea so the two never drift apart. */
export type FieldTone = "dark" | "light";

/** Surface, text and placeholder colours per tone. */
const toneClasses: Record<FieldTone, string> = {
  dark: "bg-surface text-on-dark placeholder:text-on-dark-muted",
  light: "bg-card-muted text-ink placeholder:text-ink-muted",
};

/** Border colour per tone. Error replaces it entirely (no conflicting classes). */
const borderClasses: Record<FieldTone, string> = {
  dark: "border-transparent focus:border-lime",
  light: "border-transparent focus:border-ink",
};

const errorBorderClasses = "border-danger focus:border-danger";

const labelToneClasses: Record<FieldTone, string> = {
  dark: "text-on-dark",
  light: "text-ink",
};

export function fieldClasses(tone: FieldTone, invalid: boolean, extra?: string): string {
  return cn(
    "block w-full rounded-md border-2 px-4 text-base font-medium outline-none transition-colors duration-base ease-standard",
    "disabled:cursor-not-allowed disabled:opacity-50",
    toneClasses[tone],
    invalid ? errorBorderClasses : borderClasses[tone],
    extra,
  );
}

export function labelClasses(tone: FieldTone): string {
  return cn("text-sm font-semibold", labelToneClasses[tone]);
}

export function messageClasses(): string {
  return "text-sm font-medium text-danger";
}
