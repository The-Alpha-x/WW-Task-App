import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
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
  primary:
    "bg-lime text-ink enabled:hover:brightness-95 enabled:active:brightness-90",
  secondary:
    "bg-card text-ink enabled:hover:bg-card-muted enabled:active:bg-card-muted",
  dark: "bg-background text-on-dark enabled:hover:bg-surface enabled:active:bg-surface-raised",
  ghost:
    "bg-transparent text-on-dark enabled:hover:bg-surface enabled:active:bg-surface-raised",
  /** Destructive confirmation (e.g. delete). Dark text keeps AA contrast on the red. */
  danger:
    "bg-danger text-white enabled:hover:brightness-95 enabled:active:brightness-90",
  icon: "bg-surface text-on-dark enabled:hover:bg-surface-raised enabled:active:bg-surface-raised",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-16 px-8 text-lg",
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
