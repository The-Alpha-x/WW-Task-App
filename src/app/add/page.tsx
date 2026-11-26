import type { Metadata } from "next";
import { AddSelection } from "@/components/add/AddSelection";

export const metadata: Metadata = { title: "Add New" };

export default function AddPage() {
  return <AddSelection />;
}
