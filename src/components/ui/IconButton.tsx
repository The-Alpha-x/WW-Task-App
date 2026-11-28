import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type IconButtonVariant = "dark" | "light" | "ghost";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  /** Lucide icon component, e.g. `ArrowLeft`. */
  icon: LucideIcon;
  /** Accessible name. Required because the button has no visible text. */
  label: string;
  variant?: IconButtonVariant;
  /** sm 40px, md 48px (reference size), lg 64px. */
  size?: IconButtonSize;
  className?: string;
}

const variantClasses: Record<IconButtonVariant, string> = {
  dark: "bg-surface text-on-dark ring-1 ring-glass-border/10 enabled:hover:bg-surface-raised enabled:active:bg-surface-raised",
  light: "bg-card text-ink ring-1 ring-glass-border/10 enabled:hover:bg-card-muted enabled:active:bg-card-muted",
  /** Bare icon on the dark page, e.g. the "..." beside a section heading. */
  ghost: "bg-transparent text-on-dark enabled:hover:bg-surface enabled:active:bg-surface-raised",
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

const iconSizes: Record<IconButtonSize, number> = { sm: 18, md: 22, lg: 28 };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon: Icon, label, variant = "dark", size = "md", className, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(
          "btn shrink-0 rounded-full disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...rest}
      >
        <Icon aria-hidden="true" size={iconSizes[size]} strokeWidth={2} />
      </button>
    );
  },
);
