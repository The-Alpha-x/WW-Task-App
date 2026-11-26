import { forwardRef } from "react";
import { Bell } from "lucide-react";
import { IconButton } from "./IconButton";
import type { IconButtonProps } from "./IconButton";
import { cn } from "@/lib/cn";

export interface NotificationButtonProps
  extends Omit<IconButtonProps, "icon" | "label" | "variant"> {
  /** Shows the lime indicator. Defaults to true, as in the reference. */
  hasUnread?: boolean;
  /** Accessible name. Defaults to "Notifications". */
  label?: string;
}

export const NotificationButton = forwardRef<HTMLButtonElement, NotificationButtonProps>(
  function NotificationButton(
    { hasUnread = true, label = "Notifications", className, ...rest },
    ref,
  ) {
    return (
      <span className="relative inline-flex shrink-0">
        <IconButton
          ref={ref}
          icon={Bell}
          variant="dark"
          label={hasUnread ? `${label} (new)` : label}
          className={cn(className)}
          {...rest}
        />
        {hasUnread && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-3 h-3 w-3 rounded-full border-2 border-surface bg-lime"
          />
        )}
      </span>
    );
  },
);
