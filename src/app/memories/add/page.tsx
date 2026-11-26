import type { Metadata } from "next";
import { AddMemory } from "@/components/memories/AddMemory";
export const metadata: Metadata = { title: "Add Memory" };
export default function AddMemoryPage() { return <AddMemory />; }
