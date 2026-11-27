import type { Metadata } from "next";
import { MemoriesPageClient } from "@/components/memories/MemoriesPageClient";

export const metadata: Metadata = { title: "Memories" };

export default function MemoriesPage() {
  return <MemoriesPageClient />;
}
