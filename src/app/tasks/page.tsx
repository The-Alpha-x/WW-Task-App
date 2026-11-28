import type { Metadata } from "next";
import { TasksPageClient } from "./tasks-page-client";
import { PageContainer } from "@/components/layout/PageContainer";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <PageContainer>
      <TasksPageClient />
    </PageContainer>
  );
}
