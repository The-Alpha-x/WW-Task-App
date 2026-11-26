import type { Metadata } from "next";
import { AddTask } from "@/components/tasks/AddTask";

export const metadata: Metadata = { title: "Add Task" };

export default function AddTaskPage() {
  return <AddTask />;
}
