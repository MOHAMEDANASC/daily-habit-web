"use client";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { HabitForm } from "@/features/habits/habit-form";
import { useHabit } from "@/features/habits/hooks";

export function EditHabit({ id }: { id: string }) {
  const { data, isPending, isError, error, refetch } = useHabit(id);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit habit" description="Changes apply from now on. Your history stays as it is." />
      {isPending ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} title="We couldn't find that habit" />
      ) : (
        <HabitForm habit={data.habit} />
      )}
    </div>
  );
}
