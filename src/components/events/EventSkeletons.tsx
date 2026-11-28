import { cn } from "@/lib/cn";

/** Loading placeholder shaped like the event cards. Announced once, not per card. */
export function EventListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" className="grid gap-3 md:grid-cols-2 md:gap-4">
      <span className="sr-only">Loading your events</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={cn(
            "flex animate-pulse gap-4 rounded-lg bg-surface p-5 md:p-6",
            index === 0 && "md:col-span-2",
          )}
        >
          <div className="h-20 w-16 shrink-0 rounded-md bg-surface-raised" />
          <div className="flex flex-1 flex-col gap-3 py-1">
            <div className="h-5 w-2/3 rounded-full bg-surface-raised" />
            <div className="h-4 w-1/3 rounded-full bg-surface-raised" />
            <div className="h-4 w-full rounded-full bg-surface-raised" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Loading placeholder for the details view. */
export function EventDetailsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex animate-pulse flex-col gap-5">
      <span className="sr-only">Loading this event</span>
      <div aria-hidden="true" className="h-10 w-3/4 rounded-full bg-surface" />
      <div aria-hidden="true" className="h-5 w-1/2 rounded-full bg-surface" />
      <div aria-hidden="true" className="h-40 rounded-lg bg-surface" />
      <div aria-hidden="true" className="h-32 rounded-lg bg-surface" />
    </div>
  );
}
