"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { keys } from "@/lib/query-keys";
import type { GoalInput } from "@/shared/validations/goal";
import type { GoalDTO } from "@/shared/api-types";

export function useGoals() {
  return useQuery({
    queryKey: keys.goals,
    queryFn: async () => (await api.get<{ goals: GoalDTO[] }>("/api/goals")).goals,
  });
}

export function useSaveGoal(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GoalInput) =>
      id ? api.patch<{ goal: GoalDTO }>(`/api/goals/${id}`, input) : api.post<{ goal: GoalDTO }>("/api/goals", input),
    onSuccess: () => {
      toast.success(id ? "Goal updated" : "Goal created");
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.goals }),
        queryClient.invalidateQueries({ queryKey: keys.notificationsAll }),
      ]);
    },
  });
}

export function useArchiveGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      api.patch<{ goal: GoalDTO }>(`/api/goals/${id}`, { status: archived ? "ARCHIVED" : "ACTIVE" }),
    onSuccess: (_d, { archived }) => {
      toast.success(archived ? "Goal archived" : "Goal reactivated");
      return queryClient.invalidateQueries({ queryKey: keys.goals });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: true }>(`/api/goals/${id}`),
    onSuccess: () => {
      toast.success("Goal deleted");
      return queryClient.invalidateQueries({ queryKey: keys.goals });
    },
    onError: (error) => toast.error(error.message),
  });
}
