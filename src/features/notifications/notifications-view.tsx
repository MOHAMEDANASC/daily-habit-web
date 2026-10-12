"use client";

import { Bell, BellRing, CheckCheck, Flame, PartyPopper, Settings2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarkAllRead, useNotifications, useUpdateNotification } from "@/features/notifications/hooks";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationDTO, NotificationTypeValue } from "@/shared/api-types";

const TYPE_ICON: Record<NotificationTypeValue, typeof Bell> = {
  REMINDER: BellRing,
  MILESTONE: PartyPopper,
  STREAK: Flame,
  SYSTEM: Bell,
};
const TYPE_LABEL: Record<NotificationTypeValue, string> = { REMINDER: "Reminder", MILESTONE: "Milestone", STREAK: "Streak", SYSTEM: "Info" };

function Item({ n }: { n: NotificationDTO }) {
  const update = useUpdateNotification();
  const Icon = TYPE_ICON[n.type];
  const unread = n.readAt === null;
  const body = (
    <>
      <div className="flex items-center gap-2">
        <h3 className={cn("text-sm", unread ? "font-semibold" : "font-medium")}>{n.title}</h3>
        {unread ? <span className="size-2 rounded-full bg-primary" aria-hidden="true" /> : null}
        {unread ? <span className="sr-only">Unread</span> : null}
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {TYPE_LABEL[n.type]} · <time dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time>
      </p>
    </>
  );
  return (
    <Card className={cn("card-soft flex-row items-start gap-3 rounded-2xl p-4", unread && "border-primary/30 bg-accent/30")}>
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground" aria-hidden="true">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        {n.href ? (
          <Link href={n.href} onClick={() => unread && update.mutate({ id: n.id, read: true })} className="block rounded-md hover:underline">
            {body}
          </Link>
        ) : (
          body
        )}
      </div>
      <div className="flex shrink-0 items-center">
        {unread ? (
          <Button variant="ghost" size="icon" onClick={() => update.mutate({ id: n.id, read: true })} aria-label={`Mark "${n.title}" as read`}>
            <CheckCheck aria-hidden="true" />
          </Button>
        ) : null}
        <Button variant="ghost" size="icon" onClick={() => update.mutate({ id: n.id, dismissed: true })} aria-label={`Dismiss "${n.title}"`}>
          <X aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
}

export function NotificationsView() {
  const [status, setStatus] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useNotifications({ status, page });
  const markAll = useMarkAllRead();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Reminders, milestones and streak updates."
        actions={
          <>
            <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending || !data?.unreadCount}>
              <CheckCheck aria-hidden="true" /> Mark all read
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings#notifications">
                <Settings2 aria-hidden="true" /> Preferences
              </Link>
            </Button>
          </>
        }
      />

      <Tabs
        value={status}
        onValueChange={(v) => {
          setStatus(v as typeof status);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="all" className="min-h-9 px-3">All</TabsTrigger>
          <TabsTrigger value="unread" className="min-h-9 px-3">Unread{data ? ` (${data.unreadCount})` : ""}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isPending ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Bell} title={status === "unread" ? "You're all caught up" : "No notifications yet"} description="Reminders you set on habits and milestones you reach will appear here." />
      ) : (
        <>
          <ul className="space-y-3" aria-live="polite">
            {data.items.map((n) => (
              <li key={n.id}>
                <Item n={n} />
              </li>
            ))}
          </ul>
          {data.total > data.pageSize ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Page {data.page}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!data.hasMore} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
