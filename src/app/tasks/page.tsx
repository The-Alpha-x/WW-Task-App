import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TasksPageClient } from "./tasks-page-client";
import { PageContainer } from "@/components/layout/PageContainer";
import { ADD_TASK_HREF } from "@/lib/navigation";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <PageContainer>
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold text-on-dark">Tasks</h1>
          <p className="text-sm font-medium text-on-dark-muted">
            Manage your tasks and stay organized.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={ADD_TASK_HREF}
            aria-label="Add task"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-ink shadow-glass transition hover:brightness-105 active:brightness-95"
          >
            <Plus aria-hidden="true" size={19} strokeWidth={2} />
          </Link>
        </div>
      </header>
      <TasksPageClient />
    </PageContainer>
  );
}
