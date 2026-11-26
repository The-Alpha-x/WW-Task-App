import type { Metadata } from "next";
import { BookHeart } from "lucide-react";
import { AddPlaceholder } from "@/components/add/AddPlaceholder";

export const metadata: Metadata = { title: "Add Memory" };

/** Placeholder route. The real memory form is built in Task 03. */
export default function AddMemoryPage() {
  return <AddPlaceholder title="Add Memory" feature="Memory creation" icon={BookHeart} />;
}
