"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useUser } from "@/components/layout/user-context";
import { Button } from "@/components/ui/button";
import { useUnreadNotifications } from "@/features/notifications/hooks";

/**
 * Bell with an unread badge. While the app is open it polls for new notifications and, only if
 * the user has enabled browser notifications AND granted permission, mirrors new ones as
 * system notifications. There is no background delivery when the app is closed.
 */
export function NotificationBell() {
  const user = useUser();
  const { data } = useUnreadNotifications();
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!data) return;
    if (seen.current === null) {
      seen.current = new Set(data.items.map((n) => n.id)); // do not alert for what already existed
      return;
    }
    const fresh = data.items.filter((n) => !seen.current?.has(n.id));
    fresh.forEach((n) => seen.current?.add(n.id));
    if (
      fresh.length > 0 &&
      user.browserNotifications &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      for (const n of fresh.slice(0, 3)) new Notification(n.title, { body: n.message, tag: n.id });
    }
  }, [data, user.browserNotifications]);

  const unread = data?.unreadCount ?? 0;
  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link href="/notifications" aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}>
        <Bell aria-hidden="true" />
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
