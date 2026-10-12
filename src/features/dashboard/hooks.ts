"use client";

import { useQuery } from "@tanstack/react-query";
import { api, queryString } from "@/lib/api-client";
import { keys } from "@/lib/query-keys";
import type { AnalyticsDTO, CalendarDTO, DashboardDTO } from "@/shared/api-types";

export function useDashboard() {
  return useQuery({ queryKey: keys.dashboard, queryFn: () => api.get<DashboardDTO>("/api/dashboard") });
}

export function useCalendar(month: string) {
  return useQuery({
    queryKey: keys.calendar(month),
    queryFn: () => api.get<CalendarDTO>(`/api/calendar${queryString({ month })}`),
    placeholderData: (previous) => previous,
  });
}

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  habitId?: string;
  category?: string;
}

export function useAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: keys.analytics(filters),
    queryFn: () => api.get<AnalyticsDTO>(`/api/analytics${queryString({ ...filters })}`),
    placeholderData: (previous) => previous,
  });
}
