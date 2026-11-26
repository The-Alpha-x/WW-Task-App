"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAction } from "@/hooks/useAction";
import { createEmptyEventForm, type EventFormSubmission } from "@/lib/events/form";
import { ADD_HREF } from "@/lib/navigation";
import { createEvent } from "@/services/events";
import type { Event } from "@/types/event";
import { EventForm } from "./EventForm";
import { EventSavedPanel } from "./EventSavedPanel";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * "Add event" page. Same frame as Add Task (back link, title, notification
 * button, big question, form). Saving calls `createEvent` (the service
 * validates again and writes); success swaps the form for a confirmation.
 */
export function AddEvent() {
  const router = useRouter();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const { run, pending, error } = useAction("Could not save this event.");
  const [saved, setSaved] = useState<Event | null>(null);
  /** Changing the key remounts the form, so "Add another" starts blank. */
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (values: EventFormSubmission) => {
    // An object holder: assignments inside the callback are not tracked by
    // TypeScript's flow analysis for a plain `let`.
    const result: { event?: Event } = {};
    const ok = await run(async () => {
      if (!user) throw new Error("Sign in to save events.");
      result.event = await createEvent(user.uid, values);
    });
    if (ok && result.event) setSaved(result.event);
  };

  const handleAddAnother = () => {
    setSaved(null);
    setFormKey((key) => key + 1);
  };

  return (
    <PageContainer className="flex min-h-[calc(100dvh-7rem)] flex-col gap-6 md:min-h-screen md:py-10">
      <header className="flex items-center gap-3">
        <Link
          href={ADD_HREF}
          aria-label="Back to add options"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-on-dark transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
        >
          <ArrowLeft aria-hidden="true" size={22} />
        </Link>
        <h1 className="text-lg font-semibold text-on-dark">Add Event</h1>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {saved ? (
          <EventSavedPanel key="saved" event={saved} onAddAnother={handleAddAnother} />
        ) : (
          <motion.div
            key={`form-${formKey}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.2 : 0.4, ease: EASE_OUT }}
            className="flex flex-col gap-6"
          >
            <h2 className="text-3xl font-bold leading-tight text-on-dark">
              What are you planning?
            </h2>
            <EventForm
              initialValues={createEmptyEventForm()}
              saving={pending}
              error={error}
              submitLabel="Add Event"
              savingLabel="Saving event..."
              onSubmit={(values) => void handleSubmit(values)}
              onCancel={() => router.push(ADD_HREF)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
