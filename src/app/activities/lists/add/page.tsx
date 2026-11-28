import type { Metadata } from "next";
import { AddList } from "@/components/lists/AddList";

export const metadata: Metadata = { title: "New List" };

export default function AddListPage() {
  return <AddList />;
}
