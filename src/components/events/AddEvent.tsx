"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/components/ui/Toaster";
import { useAction } from "@/hooks/useAction";
import { formatEventWhen } from "@/lib/events/display";
import { createEmptyEventForm, type EventFormSubmission } from "@/lib/events/form";
import { EVENTS_HREF } from "@/lib/navigation";
import { createEvent } from "@/services/events";
import { EventForm } from "./EventForm";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * "Add event" page matching AddTask: header, dark glassmorphic form cards,
 * animated toast confirmation, and immediate redirect to `/events`.
 */
export function AddEvent() {
  const router = useRouter();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const { run, pending, error } = useAction("Could not save this event.");

  const handleSubmit = async (values: EventFormSubmission) => {
    const ok = await run(async () => {
      if (!user) throw new Error("Sign in to save events.");
      await createEvent(user.uid, values);
    });
    if (ok) {
      toast.success("Event added", `${values.title} · ${formatEventWhen(values)}`);
      router.push(EVENTS_HREF);
    } else {
      toast.error("Could not save event", "Please check your details and try again.");
    }
  };

  return (
    <PageContainer className="flex flex-col gap-5 sm:gap-6">
      <header className="mx-auto flex w-full max-w-2xl flex-col gap-1 lg:max-w-none">
        <h1 className="text-2xl font-bold text-on-dark">Add Event</h1>
        <p className="text-sm font-medium text-on-dark-muted">
          Plan dinners, trips, and special dates so you always know what is next.
        </p>
      </header>

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.2 : 0.4, ease: EASE_OUT }}
      >
        <EventForm
          initialValues={createEmptyEventForm()}
          saving={pending}
          error={error}
          submitLabel="Add Event"
          savingLabel="Saving event..."
          onSubmit={(values) => void handleSubmit(values)}
        />
      </motion.div>
    </PageContainer>
  );
}
