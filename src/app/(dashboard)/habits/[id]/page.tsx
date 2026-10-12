import type { Metadata } from "next";
import { HabitDetail } from "@/features/habits/habit-detail";

export const metadata: Metadata = { title: "Habit details" };

export default async function HabitDetailPage({ params }: PageProps<"/habits/[id]">) {
  const { id } = await params;
  return <HabitDetail id={id} />;
}
