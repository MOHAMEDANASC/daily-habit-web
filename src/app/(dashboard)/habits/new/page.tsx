import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { HabitForm } from "@/features/habits/habit-form";

export const metadata: Metadata = { title: "New habit" };

export default function NewHabitPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Create a habit" description="Small, specific and repeatable beats ambitious. You can edit everything later." />
      <HabitForm />
    </div>
  );
}
