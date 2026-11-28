"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/components/ui/Toaster";
import { useAction } from "@/hooks/useAction";
import { formatMemoryWhen } from "@/lib/memories/display";
import {
  createEmptyMemoryForm,
  type MemoryFormValues,
} from "@/lib/memories/form";
import { MEMORIES_HREF } from "@/lib/navigation";
import { createMemory } from "@/services/memories";
import { MemoryForm } from "./MemoryForm";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * "Add memory" page matching AddEvent: header, dark glassmorphic form cards,
 * animated toast confirmation, and immediate redirect to `/memories`.
 */
export function AddMemory() {
  const router = useRouter();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const { run, pending, error } = useAction("Could not save this memory.");

  const handleSubmit = async (values: MemoryFormValues) => {
    const payload: MemoryFormValues = {
      ...values,
      time: values.time ?? "",
      type: "shared",
    };
    const ok = await run(async () => {
      if (!user) throw new Error("Sign in to save memories.");
      await createMemory(user.uid, payload);
    });
    if (ok) {
      toast.success(
        "Memory added",
        `${payload.title} · ${formatMemoryWhen({ date: payload.date, time: payload.time || null })}`,
      );
      router.push(MEMORIES_HREF);
    } else {
      toast.error(
        "Could not save memory",
        "Please check your details and try again.",
      );
    }
  };

  return (
    <PageContainer className="flex flex-col gap-5 sm:gap-6">
      <header className="mx-auto flex w-full max-w-2xl flex-col gap-1 lg:max-w-none">
        <h1 className="text-2xl font-bold text-on-dark">Add Memory</h1>
        <p className="text-sm font-medium text-on-dark-muted">
          Capture a special moment — a day worth remembering forever.
        </p>
      </header>

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.2 : 0.4, ease: EASE_OUT }}
      >
        <MemoryForm
          initialValues={createEmptyMemoryForm()}
          saving={pending}
          error={error}
          submitLabel="Add Memory"
          savingLabel="Saving memory..."
          onSubmit={(values) => void handleSubmit(values)}
        />
      </motion.div>
    </PageContainer>
  );
}
