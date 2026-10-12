import type { Metadata } from "next";
import { EditHabit } from "@/features/habits/edit-habit";

export const metadata: Metadata = { title: "Edit habit" };

export default async function EditHabitPage({ params }: PageProps<"/habits/[id]/edit">) {
  const { id } = await params;
  return <EditHabit id={id} />;
}
