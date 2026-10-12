import type { Metadata } from "next";
import { HabitList } from "@/features/habits/habit-list";

export const metadata: Metadata = { title: "Habits" };

export default function HabitsPage() {
  return <HabitList />;
}
