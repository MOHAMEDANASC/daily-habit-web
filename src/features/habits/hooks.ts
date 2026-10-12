"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queryString } from "@/lib/api-client";
import { keys } from "@/lib/query-keys";
import type { HabitInput } from "@/shared/validations/habit";
import { invalidateCompletionData } from "@/features/completions/hooks";
import type { CompletionDTO, HabitDetailDTO, HabitDTO, HabitStateDTO, PageDTO } from "@/shared/api-types";

export interface HabitFilters {
  q?: string;
  category?: string;
  status?: "active" | "archived" | "all" | "completed" | "incomplete";
  sort?: "name" | "created" | "status";
  order?: "asc" | "desc";
  date?: string;
}

export function useHabits(filters: HabitFilters) {
  return useQuery({
    queryKey: keys.habits(filters),
    queryFn: async () => (await api.get<{ habits: HabitStateDTO[] }>(`/api/habits${queryString({ ...filters })}`)).habits,
    placeholderData: (previous) => previous,
  });
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: keys.habit(id),
    queryFn: () => api.get<HabitDetailDTO>(`/api/habits/${id}`),
  });
}

export function useHabitHistory(id: string, page: number) {
  return useQuery({
    queryKey: keys.habitHistory(id, page),
    queryFn: () => api.get<PageDTO<CompletionDTO>>(`/api/habits/${id}/completions${queryString({ page, pageSize: 10 })}`),
    placeholderData: (previous) => previous,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: HabitInput) => api.post<{ habit: HabitDTO }>("/api/habits", input),
    onSuccess: () => {
      toast.success("Habit created");
      return invalidateCompletionData(queryClient);
    },
  });
}

export function useUpdateHabit(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<HabitInput> & { archived?: boolean }) =>
      api.patch<{ habit: HabitDTO }>(`/api/habits/${id}`, patch),
    onSuccess: (_data, patch) => {
      if (patch.archived === undefined) toast.success("Habit updated");
      return invalidateCompletionData(queryClient);
    },
  });
}

export function useArchiveHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      api.patch<{ habit: HabitDTO }>(`/api/habits/${id}`, { archived }),
    onSuccess: (_data, { archived }) => {
      toast.success(archived ? "Habit archived. Your history is kept." : "Habit reactivated");
      return invalidateCompletionData(queryClient);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: true }>(`/api/habits/${id}`),
    onSuccess: () => {
      toast.success("Habit deleted");
      return invalidateCompletionData(queryClient);
    },
    onError: (error) => toast.error(error.message),
  });
}
