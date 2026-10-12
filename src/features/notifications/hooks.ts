"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queryString } from "@/lib/api-client";
import { keys } from "@/lib/query-keys";
import type { NotificationDTO, NotificationPageDTO } from "@/shared/api-types";

export interface NotificationFilters {
  status: "all" | "unread";
  page: number;
}

export function useNotifications(filters: NotificationFilters) {
  return useQuery({
    queryKey: keys.notifications(filters),
    queryFn: () => api.get<NotificationPageDTO>(`/api/notifications${queryString({ ...filters, pageSize: 15 })}`),
    placeholderData: (previous) => previous,
  });
}

/** Polled lightly so the bell badge (and optional browser alerts) stay current while the app is open. */
export function useUnreadNotifications(refetchIntervalMs = 60_000) {
  return useQuery({
    queryKey: keys.unread,
    queryFn: () => api.get<NotificationPageDTO>(`/api/notifications${queryString({ status: "unread", pageSize: 5 })}`),
    refetchInterval: refetchIntervalMs,
    refetchIntervalInBackground: false,
  });
}

export function useUpdateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; read?: boolean; dismissed?: boolean }) =>
      api.patch<{ notification: NotificationDTO }>(`/api/notifications/${id}`, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.notificationsAll }),
    onError: (error) => toast.error(error.message),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ updated: number }>("/api/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.notificationsAll }),
    onError: (error) => toast.error(error.message),
  });
}
