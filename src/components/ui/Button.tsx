import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "dark"
  | "ghost"
  | "danger"
  | "icon";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children"
> {
  size?: ButtonSize;
  /** Shows a spinner, sets aria-busy and blocks clicks. */
  loading?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: ReactNode;
  className?: string;
}

interface LabelledButtonProps extends ButtonBaseProps {
  variant?: Exclude<ButtonVariant, "icon">;
  children: ReactNode;
}

/** The icon variant has no visible text, so an accessible name is required. */
interface IconVariantButtonProps extends ButtonBaseProps {
  variant: "icon";
  "aria-label": string;
  children?: ReactNode;
}

export type ButtonProps = LabelledButtonProps | IconVariantButtonProps;

const variantClasses: Record<ButtonVariant, string> = {
  /** Volt Lime: the one primary action per form / dialog. */
  primary:
    "bg-lime font-bold text-ink enabled:hover:bg-lime-soft enabled:active:brightness-[0.9]",
  secondary:
    "bg-blue text-ink enabled:hover:brightness-95 enabled:active:brightness-[0.88]",
  /** Quiet secondary action (Cancel, Keep, Back): outlined, never competes with lime. */
  outline:
    "bg-transparent text-on-dark ring-1 ring-glass-border/25 enabled:hover:bg-surface-raised enabled:hover:ring-glass-border/40 enabled:active:bg-surface-raised",
  dark: "bg-background text-on-dark ring-1 ring-glass-border/10 enabled:hover:bg-surface enabled:active:bg-surface-raised",
  ghost:
    "bg-transparent text-on-dark enabled:hover:bg-surface enabled:active:bg-surface-raised",
  /** Destructive confirmation (e.g. delete). Dark text keeps AA contrast on the red. */
  danger:
    "bg-danger text-ink enabled:hover:brightness-95 enabled:active:brightness-90",
  icon: "bg-surface text-on-dark ring-1 ring-glass-border/10 enabled:hover:bg-surface-raised enabled:active:bg-surface-raised",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-7 text-base",
  lg: "h-16 px-10 text-lg",
};

/** Square footprint for the icon variant (matches IconButton sizes). */
const iconSizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    } = props;

    const isIcon = variant === "icon";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "btn shrink-0 select-none whitespace-nowrap disabled:cursor-not-allowed",
          variantClasses[variant],
          "rounded-full",
          isIcon ? iconSizeClasses[size] : sizeClasses[size],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
