import type { Metadata } from "next";
import { MemoriesPageClient } from "@/components/memories/MemoriesPageClient";
export const metadata: Metadata = { title: "Memories" };
export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    memory?: string | string[];
    notice?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
  return (
    <MemoriesPageClient
      requestedMemoryId={first(params.memory)}
      notice={first(params.notice)}
    />
  );
}
