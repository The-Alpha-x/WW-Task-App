import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { fieldClasses, labelClasses, messageClasses } from "./field-styles";
import type { FieldTone } from "./field-styles";

export type TextareaResize = "none" | "vertical" | "both";

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label: string;
  error?: string;
  tone?: FieldTone;
  /** Resize handle behaviour. Defaults to vertical. */
  resize?: TextareaResize;
  /** Applied to the field wrapper. */
  className?: string;
}

const resizeClasses: Record<TextareaResize, string> = {
  none: "resize-none",
  vertical: "resize-y",
  both: "resize",
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, tone = "dark", resize = "vertical", className, id, rows = 4, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={fieldId} className={labelClasses(tone)}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={fieldClasses(tone, Boolean(error), cn("py-3", resizeClasses[resize]))}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className={messageClasses()}>
          {error}
        </p>
      )}
    </div>
  );
});
