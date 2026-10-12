"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queryString } from "@/lib/api-client";
import { completionPercentage } from "@/shared/completion-rules";
import { keys } from "@/lib/query-keys";
import type { DailyDTO, HabitStateDTO } from "@/shared/api-types";

export function useDaily(date: string | undefined) {
  return useQuery({
    queryKey: keys.daily(date ?? "today"),
    queryFn: () => api.get<DailyDTO>(`/api/daily${queryString({ date })}`),
    placeholderData: (previous) => previous,
  });
}

/** Everything that depends on completions has to refresh after one changes. */
export function invalidateCompletionData(queryClient: QueryClient) {
  const roots = [
    keys.dailyAll,
    keys.dashboard,
    keys.calendarAll,
    keys.habitsAll,
    ["habit"] as const,
    keys.analyticsAll,
    keys.goals,
    keys.notificationsAll,
  ];
  return Promise.all(roots.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export interface CompletionInput {
  habitId: string;
  date: string;
  completed?: boolean;
  progressValue?: number | null;
  notes?: string | null;
}

/** Recompute a day's summary from its habit list so the UI updates before the server answers. */
function withSummary(daily: DailyDTO, habits: HabitStateDTO[]): DailyDTO {
  const scheduled = habits.filter((h) => h.scheduledOnDate || h.state === "done").length;
  const completed = habits.filter((h) => h.state === "done").length;
  const status = scheduled === 0 ? "none" : completed === 0 ? "missed" : completed < scheduled ? "partial" : "complete";
  return { ...daily, habits, summary: { ...daily.summary, scheduled, completed, percentage: completionPercentage(completed, scheduled), status } };
}

function optimisticState(habit: HabitStateDTO, input: CompletionInput | null): HabitStateDTO {
  if (input === null) return { ...habit, state: "pending", progressValue: null, completedAt: null };
  const target = habit.targetValue;
  const progress = input.progressValue ?? (target && input.completed !== false ? target : null);
  const done = target ? (progress ?? 0) >= target && input.completed !== false : input.completed !== false;
  return {
    ...habit,
    state: done ? "done" : (progress ?? 0) > 0 ? "partial" : "pending",
    progressValue: progress,
    notes: input.notes === undefined ? habit.notes : input.notes,
    completedAt: done ? (habit.completedAt ?? new Date().toISOString()) : null,
  };
}

export function useSetCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date, ...body }: CompletionInput) =>
      api.put<{ habit: HabitStateDTO }>(`/api/habits/${habitId}/completions/${date}`, body),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: keys.dailyAll });
      const previous = queryClient.getQueryData<DailyDTO>(keys.daily(input.date));
      if (previous) {
        queryClient.setQueryData(
          keys.daily(input.date),
          withSummary(previous, previous.habits.map((h) => (h.id === input.habitId ? optimisticState(h, input) : h))),
        );
      }
      return { previous };
    },
    onError: (error, input, context) => {
      if (context?.previous) queryClient.setQueryData(keys.daily(input.date), context.previous);
      toast.error(error.message);
    },
    onSettled: () => invalidateCompletionData(queryClient),
  });
}

export function useUndoCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      api.delete<{ habit: HabitStateDTO }>(`/api/habits/${habitId}/completions/${date}`),
    onMutate: async ({ habitId, date }) => {
      await queryClient.cancelQueries({ queryKey: keys.dailyAll });
      const previous = queryClient.getQueryData<DailyDTO>(keys.daily(date));
      if (previous) {
        queryClient.setQueryData(
          keys.daily(date),
          withSummary(previous, previous.habits.map((h) => (h.id === habitId ? optimisticState(h, null) : h))),
        );
      }
      return { previous };
    },
    onError: (error, { date }, context) => {
      if (context?.previous) queryClient.setQueryData(keys.daily(date), context.previous);
      toast.error(error.message);
    },
    onSettled: () => invalidateCompletionData(queryClient),
  });
}
