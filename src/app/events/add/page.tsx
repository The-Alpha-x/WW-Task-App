import type { Metadata } from "next";
import { AddEvent } from "@/components/events/AddEvent";

export const metadata: Metadata = { title: "Add Event" };

export default function AddEventPage() {
  return <AddEvent />;
}
