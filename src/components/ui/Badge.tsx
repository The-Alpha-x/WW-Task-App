import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "default" | "lime" | "purple" | "orange" | "outline";
export type BadgeSize = "sm" | "md";

export interface BadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

/** `outline` is designed for light surfaces (cards), as in the reference. */
const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-card-muted text-ink",
  lime: "bg-lime text-ink",
  purple: "bg-purple text-ink",
  orange: "bg-orange text-ink",
  outline: "border border-border bg-transparent text-ink",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1 text-sm",
};

export function Badge({
  variant = "default",
  size = "md",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
