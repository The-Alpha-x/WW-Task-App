import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ADD_HREF } from "@/lib/navigation";

export interface AddPlaceholderProps {
  /** Page title, e.g. "Add Event". */
  title: string;
  /** What is coming, e.g. "Event creation". */
  feature: string;
  icon: LucideIcon;
}

/**
 * Temporary destination for creation routes that do not have a form yet.
 * Delete this component when the last placeholder route gets its real form.
 */
export function AddPlaceholder({ title, feature, icon: Icon }: AddPlaceholderProps) {
  return (
    <PageContainer className="flex min-h-[calc(100dvh-7rem)] flex-col gap-8 md:min-h-screen md:py-10">
      <header className="flex items-center gap-3">
        <Link
          href={ADD_HREF}
          aria-label="Back to add options"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-on-dark transition-colors hover:bg-surface-raised"
        >
          <ArrowLeft aria-hidden="true" size={22} />
        </Link>
        <h1 className="text-lg font-semibold text-on-dark">{title}</h1>
      </header>

      <section className="flex flex-1 flex-col items-start justify-center gap-6">
        <span
          aria-hidden="true"
          className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface text-lime"
        >
          <Icon size={30} strokeWidth={1.75} />
        </span>
        <h2 className="max-w-[16ch] text-3xl font-bold leading-tight text-on-dark">
          {feature} is coming soon
        </h2>
        <p className="max-w-[40ch] text-base text-on-dark-muted">
          This form has not been built yet. You can still add a task from the
          previous screen.
        </p>
        <Link
          href={ADD_HREF}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-ink transition-colors hover:brightness-95"
        >
          Back to add options
        </Link>
      </section>
    </PageContainer>
  );
}
