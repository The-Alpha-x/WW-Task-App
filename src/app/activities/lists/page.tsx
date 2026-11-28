import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { ListsPageClient } from "@/components/lists/ListsPageClient";

export const metadata: Metadata = { title: "Item Lists" };

export default function ListsPage() {
  return (
    <PageContainer>
      <ListsPageClient />
    </PageContainer>
  );
}
