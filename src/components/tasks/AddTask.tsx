"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/components/auth/AuthProvider";
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
  const { run, pending: isSaving, error: saveError } = useAction(
    "Could not save this task.",
  );
  const [defaultValues] = useState(() => createEmptyTaskForm(generateId("subtask")));
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
    if (saved) router.push("/tasks");
  });

  return (
    <PageContainer className="flex flex-col gap-5 sm:gap-6">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-4 lg:max-w-none">
        <Link
          href="/add"
          aria-label="Back to add options"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface/80 text-on-dark ring-1 ring-glass-border/10 transition-colors duration-fast ease-standard hover:bg-surface-raised"
        >
          <ArrowLeft aria-hidden="true" size={18} />
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-on-dark">Add Task</h1>
          <p className="text-sm font-medium text-on-dark-muted">
            Plan what needs to get done and break it into steps.
          </p>
        </div>
      </header>

      <form
        className="mx-auto flex w-full max-w-2xl flex-col gap-4 sm:gap-5 lg:max-w-none"
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
              className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/25"
            >
              {saveError}
            </motion.p>
          )}
        </AnimatePresence>

        <TaskFormFields form={form} />

        <div className="pt-1">
          <Button
            type="submit"
            size="lg"
            className="w-full shadow-lime-pill"
            loading={isSaving}
          >
            {isSaving ? "Saving task..." : "Add Task"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
