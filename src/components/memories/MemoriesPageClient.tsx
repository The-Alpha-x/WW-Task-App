"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookHeart,
  CalendarDays,
  Clock3,
  Pencil,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Badge } from "@/components/ui/Badge";
import { useUserMemories } from "@/hooks/useUserMemories";
import { useAction } from "@/hooks/useAction";
import { useNow } from "@/hooks/useNow";
import { MemoryForm } from "./MemoryForm";
import {
  memoryToFormValues,
  type MemoryFormSubmission,
} from "@/lib/memories/form";
import { deleteMemory, updateMemory } from "@/services/memories";
import { ADD_MEMORY_HREF, MEMORIES_HREF } from "@/lib/navigation";
import type { Memory } from "@/types/memory";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}
function timeLabel(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(`2000-01-01T${value}:00`))
    : "Time not specified";
}

export function MemoriesPageClient({
  requestedMemoryId,
  notice,
}: {
  requestedMemoryId: string | null;
  notice: string | null;
}) {
  const router = useRouter();
  const { memories, loading, error, user } = useUserMemories();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const save = useAction("Could not save this memory.");
  const remove = useAction("Could not delete this memory.");
  useEffect(() => {
    if (notice === "deleted") {
      setMessage("Memory deleted.");
      router.replace(MEMORIES_HREF);
    }
  }, [notice, router]);
  const selected = requestedMemoryId
    ? memories.find((m) => m.id === requestedMemoryId)
    : null;
  const handleSave = async (values: MemoryFormSubmission) => {
    if (!user || !selected) return;
    const ok = await save.run(() =>
      updateMemory(user.uid, selected.id, values),
    );
    if (ok) {
      setEditing(false);
      setMessage("Changes saved.");
    }
  };
  const handleDelete = async (memory: Memory) => {
    if (!user || !window.confirm(`Delete “${memory.title}”?`)) return;
    const ok = await remove.run(() => deleteMemory(user.uid, memory.id));
    if (ok) router.replace(`${MEMORIES_HREF}?notice=deleted`);
  };

  if (loading || !user)
    return (
      <PageContainer className="py-10">
        <p className="text-on-dark-muted">Loading memories...</p>
      </PageContainer>
    );
  if (error)
    return (
      <PageContainer className="py-10">
        <h1 className="text-2xl font-bold text-on-dark">
          Could not load memories
        </h1>
        <p className="mt-2 text-on-dark-muted">{error}</p>
      </PageContainer>
    );

  if (requestedMemoryId) {
    if (!selected)
      return (
        <PageContainer className="flex flex-col gap-4 py-10">
          <h1 className="text-2xl font-bold text-on-dark">Memory not found</h1>
          <p className="text-on-dark-muted">
            It may have been deleted or is not available to this account.
          </p>
          <ButtonLink href={MEMORIES_HREF}>Back to memories</ButtonLink>
        </PageContainer>
      );
    return (
      <PageContainer className="flex min-h-[calc(100dvh-7rem)] flex-col gap-6 md:py-10">
        <header className="flex items-center gap-3">
          <Link
            href={MEMORIES_HREF}
            aria-label="Back to memories"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-on-dark"
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className="flex-1 text-center text-lg font-semibold text-on-dark">
            {editing ? "Edit Memory" : "Memory Details"}
          </h1>
          <span className="w-12" />
        </header>
        {editing ? (
          <MemoryForm
            initialValues={memoryToFormValues(selected)}
            original={{ date: selected.date, time: selected.time }}
            saving={save.pending}
            error={save.error}
            submitLabel="Save Changes"
            onSubmit={handleSave}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <article className="flex flex-col gap-5 rounded-2xl bg-card p-6 text-ink md:p-8">
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <BookHeart size={18} />
              <span>Saved memory</span>
            </div>
            <h2 className="text-3xl font-bold">{selected.title}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                <CalendarDays size={14} />
                {dateLabel(selected.date)}
              </Badge>
              <Badge variant="orange">
                <Clock3 size={14} />
                {timeLabel(selected.time)}
              </Badge>
              <Badge variant={selected.type === "shared" ? "lime" : "default"}>
                {selected.type === "shared" ? (
                  <Users size={14} />
                ) : (
                  <User size={14} />
                )}{" "}
                {selected.type}
              </Badge>
            </div>
            {selected.description && (
              <p className="whitespace-pre-wrap leading-relaxed">
                {selected.description}
              </p>
            )}
            {selected.notes && (
              <section className="rounded-xl bg-background p-4">
                <h3 className="mb-2 font-semibold">Notes</h3>
                <p className="whitespace-pre-wrap text-ink-muted">
                  {selected.notes}
                </p>
              </section>
            )}
            <p className="text-xs text-ink-muted">
              Created {new Date(selected.createdAt).toLocaleString()} · Last
              updated {new Date(selected.updatedAt).toLocaleString()}
            </p>
            {message && (
              <p role="status" className="text-sm text-success">
                {message}
              </p>
            )}
            {save.error && (
              <p role="alert" className="text-sm text-danger">
                {save.error}
              </p>
            )}
            {remove.error && (
              <p role="alert" className="text-sm text-danger">
                {remove.error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setEditing(true)}>
                <Pencil size={16} /> Edit
              </Button>
              <Button
                variant="ghost"
                onClick={() => void handleDelete(selected)}
                loading={remove.pending}
              >
                <Trash2 size={16} /> Delete
              </Button>
            </div>
          </article>
        )}
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col gap-6 py-8 md:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-dark">Our Memories</h1>
          <p className="mt-2 text-on-dark-muted">
            Little moments, kept close forever.
          </p>
        </div>
        <ButtonLink href={ADD_MEMORY_HREF}>Add Memory</ButtonLink>
      </header>
      {message && (
        <p role="status" className="rounded-xl bg-lime p-3 text-sm text-ink">
          {message}
        </p>
      )}
      {memories.length === 0 ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-surface p-10 text-center">
          <BookHeart size={42} className="text-lime" />
          <h2 className="text-xl font-bold text-on-dark">
            Your memory book is waiting
          </h2>
          <p className="max-w-md text-on-dark-muted">
            Save a special day, a funny incident, or a little moment you want to
            remember together.
          </p>
          <ButtonLink href={ADD_MEMORY_HREF}>Save your first memory</ButtonLink>
        </section>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {memories.map((memory) => (
            <li key={memory.id}>
              <Link
                href={`${MEMORIES_HREF}?memory=${encodeURIComponent(memory.id)}`}
                className="group flex h-full flex-col gap-3 rounded-2xl bg-card p-5 text-ink transition hover:-translate-y-0.5 hover:bg-card-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">{dateLabel(memory.date)}</Badge>
                  <Badge
                    variant={memory.type === "shared" ? "lime" : "default"}
                  >
                    {memory.type === "shared" ? "Shared" : "Individual"}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold group-hover:underline">
                  {memory.title}
                </h2>
                {memory.description && (
                  <p className="line-clamp-3 text-sm text-ink-muted">
                    {memory.description}
                  </p>
                )}
                <span className="mt-auto flex items-center gap-2 text-sm text-ink-muted">
                  <Clock3 size={14} />
                  {timeLabel(memory.time)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
