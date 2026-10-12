/** Central React Query keys, so invalidation stays consistent. */
export const keys = {
  me: ["me"] as const,
  daily: (date: string) => ["daily", date] as const,
  dailyAll: ["daily"] as const,
  habits: (filters: object) => ["habits", filters] as const,
  habitsAll: ["habits"] as const,
  habit: (id: string) => ["habit", id] as const,
  habitHistory: (id: string, page: number) => ["habit", id, "history", page] as const,
  dashboard: ["dashboard"] as const,
  calendar: (month: string) => ["calendar", month] as const,
  calendarAll: ["calendar"] as const,
  analytics: (filters: object) => ["analytics", filters] as const,
  analyticsAll: ["analytics"] as const,
  goals: ["goals"] as const,
  notifications: (filters: object) => ["notifications", filters] as const,
  notificationsAll: ["notifications"] as const,
  unread: ["notifications", "unread-count"] as const,
};
