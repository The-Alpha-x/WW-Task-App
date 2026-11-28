import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { labelClasses } from "./field-styles";
import type { FieldTone } from "./field-styles";

const OPTIONAL_SUFFIX = " (optional)";

export interface FieldLabelProps {
  htmlFor: string;
  /** Label text. A trailing "(optional)" is rendered as a quieter hint. */
  children: string;
  tone?: FieldTone;
}

/**
 * Visual-only wrapper around a field label. The text content (and therefore the
 * accessible name) is identical to the plain string; a trailing "(optional)"
 * is simply set in a lighter weight so the field name reads first.
 */
export function FieldLabel({ htmlFor, children, tone = "dark" }: FieldLabelProps) {
  const isOptional = children.endsWith(OPTIONAL_SUFFIX);
  const name: ReactNode = isOptional ? children.slice(0, -OPTIONAL_SUFFIX.length) : children;

  return (
    <label htmlFor={htmlFor} className={labelClasses(tone)}>
      {name}
      {isOptional && (
        <>
          {" "}
          <span
            className={cn(
              "font-medium",
              tone === "dark" ? "text-on-dark-muted" : "text-ink-muted",
            )}
          >
            (optional)
          </span>
        </>
      )}
    </label>
  );
}
