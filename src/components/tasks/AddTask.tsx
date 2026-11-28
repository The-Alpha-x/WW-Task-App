"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FormActions } from "@/components/ui/FormActions";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/components/ui/Toaster";
import { useAction } from "@/hooks/useAction";
import {
  createEmptyTaskForm,
  createTaskFormSchema,
  type TaskFormValues,
} from "@/lib/tasks/form";
import { generateId } from "@/lib/id";
import { buildNewTask, createTask } from "@/services/tasks";
import { TaskFormFields } from "./TaskFormFields";

export function AddTask() {
  const router = useRouter();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const {
    run,
    pending: isSaving,
    error: saveError,
  } = useAction("Could not save this task.");
  const [defaultValues] = useState(() =>
    createEmptyTaskForm(generateId("subtask")),
  );
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(createTaskFormSchema()),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (input) => {
    if (isSaving) return;
    const saved = await run(async () => {
      if (!user) throw new Error("Sign in to save tasks.");
      await createTask(user.uid, buildNewTask(user.uid, input));
    });
    if (saved) {
      toast.success("Task added", input.title.trim());
      router.push("/tasks");
    } else {
      toast.error(
        "Could not save task",
        "Please check your details and try again.",
      );
    }
  });

  return (
    <PageContainer className="flex flex-col gap-6 sm:gap-8">
      <header className="mx-auto flex w-full max-w-2xl flex-col gap-2 lg:max-w-none">
        <h1 className="type-display-lg text-on-dark">Add Task</h1>
        <p className="type-body text-on-dark-muted">
          Plan what needs to get done and break it into steps.
        </p>
      </header>

      <form
        className="mx-auto flex w-full max-w-2xl flex-col gap-5 md:gap-6 lg:max-w-none"
        onSubmit={handleSubmit}
        noValidate
      >
        <AnimatePresence initial={false}>
          {saveError && (
            <motion.p
              role="alert"
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="form-alert"
            >
              {saveError}
            </motion.p>
          )}
        </AnimatePresence>

        <TaskFormFields form={form} />

        <FormActions
          saving={isSaving}
          submitLabel="Add Task"
          savingLabel="Saving task..."
        />
      </form>
    </PageContainer>
  );
}
