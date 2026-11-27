import { cn } from "@/lib/cn";

/** Loading placeholder shaped like the memory timeline cards. */
export function MemoryListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Loading your memories</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={cn(
            "flex animate-pulse gap-4 rounded-xl bg-surface p-5",
            index === 0 && "ring-1 ring-glass-border/10",
          )}
        >
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-raised" />
          <div className="flex flex-1 flex-col gap-3 py-1">
            <div className="h-5 w-2/3 rounded-full bg-surface-raised" />
            <div className="h-4 w-full rounded-full bg-surface-raised" />
            <div className="h-3 w-1/3 rounded-full bg-surface-raised" />
          </div>
        </div>
      ))}
    </div>
  );
}
