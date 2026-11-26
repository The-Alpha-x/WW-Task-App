import type { Metadata } from "next";
import { TasksPageClient } from "./tasks-page-client";
import { PageContainer } from "@/components/layout/PageContainer";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
        <PageContainer>
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-on-dark">Tasks</h1>
            <p className="max-w-2xl text-sm font-medium text-on-dark-muted">
              Manage your tasks and stay organized.
            </p>
          </header>
          <TasksPageClient />
        </PageContainer>
  );
}
