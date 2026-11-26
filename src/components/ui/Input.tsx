import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { fieldClasses, labelClasses, messageClasses } from "./field-styles";
import type { FieldTone } from "./field-styles";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> {
  label: string;
  /** Error message. Presence puts the field into the error state. */
  error?: string;
  /** Surface the field sits on. Defaults to dark. */
  tone?: FieldTone;
  /** Applied to the field wrapper. */
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, tone = "dark", className, id, type = "text", ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={inputId} className={labelClasses(tone)}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={fieldClasses(tone, Boolean(error), "h-12")}
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
