"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookHeart, Check } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAction } from "@/hooks/useAction";
import {
  createEmptyMemoryForm,
  type MemoryFormSubmission,
} from "@/lib/memories/form";
import { ADD_HREF, MEMORIES_HREF } from "@/lib/navigation";
import { createMemory } from "@/services/memories";
import { MemoryForm } from "./MemoryForm";
import type { Memory } from "@/types/memory";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function AddMemory() {
  const router = useRouter();
  const { user } = useAuth();
  const action = useAction("Could not save this memory.");
  const [saved, setSaved] = useState<Memory | null>(null);
  const [formKey, setFormKey] = useState(0);
  const submit = async (values: MemoryFormSubmission) => {
    const result: { memory?: Memory } = {};
    const ok = await action.run(async () => {
      if (!user) throw new Error("Sign in to save memories.");
      result.memory = await createMemory(user.uid, values);
    });
    if (ok && result.memory) setSaved(result.memory);
  };
  return (
    <PageContainer className="flex min-h-[calc(100dvh-7rem)] flex-col gap-6 md:min-h-screen md:py-10">
      <header className="flex items-center gap-3">
        <Link
          href={ADD_HREF}
          aria-label="Back to add options"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-on-dark"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-lg font-semibold text-on-dark">Add Memory</h1>
      </header>
      {saved ? (
        <section className="flex flex-col items-start gap-5 rounded-2xl bg-card p-6 text-ink md:p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime">
            <Check size={28} />
          </span>
          <div>
            <h2 className="text-2xl font-bold">Memory saved!</h2>
            <p className="mt-2 text-ink-muted">
              {saved.title} is now in your memories.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={MEMORIES_HREF}>View memories</ButtonLink>
            <button
              className="rounded-full px-5 py-3 font-semibold"
              onClick={() => {
                setSaved(null);
                setFormKey((k) => k + 1);
              }}
            >
              Add another
            </button>
          </div>
        </section>
      ) : (
        <>
          <div>
            <BookHeart className="mb-3 text-lime" size={30} />
            <h2 className="text-3xl font-bold text-on-dark">
              What do you want to remember?
            </h2>
            <p className="mt-2 text-on-dark-muted">
              Save a moment you can look back on together.
            </p>
          </div>
          <MemoryForm
            key={formKey}
            initialValues={createEmptyMemoryForm()}
            saving={action.pending}
            error={action.error}
            submitLabel="Save Memory"
            onSubmit={submit}
            onCancel={() => router.push(ADD_HREF)}
          />
        </>
      )}
    </PageContainer>
  );
}
