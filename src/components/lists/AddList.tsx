"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/components/ui/Toaster";
import { useAction } from "@/hooks/useAction";
import { generateId } from "@/lib/id";
import { createEmptyListForm, type ListFormValues } from "@/lib/lists/form";
import { LISTS_HREF } from "@/lib/navigation";
import { createList } from "@/services/lists";
import { ListForm } from "./ListForm";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** "New list" page: header, the list form, a toast and a redirect to the lists page. */
export function AddList() {
  const router = useRouter();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const { run, pending, error } = useAction("Could not save this list.");
  const initialValues = useMemo(
    () => createEmptyListForm(generateId("item")),
    [],
  );

  const handleSubmit = async (values: ListFormValues) => {
    const ok = await run(async () => {
      if (!user) throw new Error("Sign in to save lists.");
      await createList(user.uid, values);
    });
    if (ok) {
      toast.success("List created", values.title.trim());
      router.push(LISTS_HREF);
    } else {
      toast.error(
        "Could not save list",
        "Please check your details and try again.",
      );
    }
  };

  return (
    <PageContainer className="flex flex-col gap-6 sm:gap-8">
      <header className="mx-auto flex w-full max-w-2xl flex-col gap-2 lg:max-w-none">
        <h1 className="type-display-lg text-on-dark">New List</h1>
        <p className="type-body text-on-dark-muted">
          A grocery list, a packing list, anything you want to keep together.
        </p>
      </header>

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.2 : 0.4, ease: EASE_OUT }}
      >
        <ListForm
          initialValues={initialValues}
          saving={pending}
          error={error}
          submitLabel="Create List"
          savingLabel="Saving list..."
          onSubmit={(values) => void handleSubmit(values)}
        />
      </motion.div>
    </PageContainer>
  );
}
