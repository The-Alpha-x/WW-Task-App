import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ButtonSize, ButtonVariant } from "./Button";

type LinkVariant = Exclude<ButtonVariant, "icon" | "danger">;

export interface ButtonLinkProps
  extends Omit<ComponentProps<typeof Link>, "className" | "children"> {
  variant?: LinkVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A navigation link that looks like `Button` (same sizes, same colours), so
 * "go somewhere" actions are real links and "do something" actions stay
 * buttons. `Button` uses `enabled:hover`, which never matches an anchor, so
 * the hover states are repeated here with plain `hover:`.
 */
const variantClasses: Record<LinkVariant, string> = {
  primary: "bg-lime font-bold text-ink hover:bg-lime-soft active:brightness-[0.9]",
  secondary: "bg-blue text-ink hover:brightness-95 active:brightness-[0.88]",
  outline:
    "bg-transparent text-on-dark ring-1 ring-glass-border/25 hover:bg-surface-raised hover:ring-glass-border/40 active:bg-surface-raised",
  dark: "bg-background text-on-dark ring-1 ring-glass-border/10 hover:bg-surface active:bg-surface-raised",
  ghost: "bg-transparent text-on-dark hover:bg-surface active:bg-surface-raised",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-7 text-base",
  lg: "h-16 px-10 text-lg",
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "btn shrink-0 select-none whitespace-nowrap rounded-full",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
