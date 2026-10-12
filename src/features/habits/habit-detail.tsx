"use client";

import { Archive, ArchiveRestore, ArrowLeft, Bell, CalendarDays, Check, Flame, Minus, Pencil, Trash2, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { HabitIcon } from "@/components/shared/habit-icon";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useArchiveHabit, useDeleteHabit, useHabit, useHabitHistory } from "@/features/habits/hooks";
import { formatDate } from "@/shared/dates";
import { cn } from "@/lib/utils";
import type { HabitDetailDTO } from "@/shared/api-types";

function Consistency({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium tabular-nums">{value === null ? "No data yet" : `${value}%`}</span>
      </div>
      <Progress value={value ?? 0} className="h-2" aria-label={`${label} consistency`} />
    </div>
  );
}

function RecentGrid({ detail }: { detail: HabitDetailDTO }) {
  const { color } = detail.habit;
  return (
    <div>
      <ul className="grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]" aria-label="Last 30 days">
        {detail.recent.map((day) => {
          const label = `${formatDate(day.date, { month: "short", day: "numeric" })}: ${
            day.state === "done" ? "done" : day.state === "partial" ? "partly done" : day.state === "pending" ? "missed or open" : "not scheduled"
          }`;
          return (
            <li
              key={day.date}
              title={label}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border text-white",
                day.state === "none" && "border-dashed bg-transparent opacity-50",
                day.state === "pending" && "bg-muted/50",
              )}
              style={day.state === "done" ? { backgroundColor: color, borderColor: color } : day.state === "partial" ? { borderColor: color, color } : undefined}
            >
              <span className="sr-only">{label}</span>
              {day.state === "done" ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : null}
              {day.state === "partial" ? <Minus className="size-3.5" strokeWidth={3} aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Check className="size-3" aria-hidden="true" /> Done</span>
        <span className="inline-flex items-center gap-1"><Minus className="size-3" aria-hidden="true" /> Partly done</span>
        <span>Empty = not done</span>
        <span>Dashed = not scheduled</span>
      </p>
    </div>
  );
}

function History({ habitId }: { habitId: string }) {
  const [page, setPage] = useState(1);
  const { data, isPending } = useHabitHistory(habitId, page);
  if (isPending) return <Skeleton className="h-40 rounded-xl" />;
  if (!data || data.items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No completions logged yet. Mark this habit done on the Today page to start the history.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <caption className="sr-only">Completion history</caption>
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-medium">Date</th>
              <th scope="col" className="py-2 pr-3 font-medium">Status</th>
              <th scope="col" className="py-2 pr-3 font-medium">Amount</th>
              <th scope="col" className="py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2.5 pr-3 whitespace-nowrap">{formatDate(item.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</td>
                <td className="py-2.5 pr-3">
                  <Badge variant={item.completed ? "default" : "secondary"}>{item.completed ? "Done" : "Partial"}</Badge>
                </td>
                <td className="py-2.5 pr-3 tabular-nums">{item.progressValue !== null ? `${item.progressValue}${item.targetUnit ? ` ${item.targetUnit}` : ""}` : "–"}</td>
                <td className="max-w-[16rem] truncate py-2.5 text-muted-foreground">{item.notes ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {data.page} · {data.total} entries
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!data.hasMore} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HabitDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, isPending, isError, error, refetch } = useHabit(id);
  const archive = useArchiveHabit();
  const del = useDeleteHabit();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} title="We couldn't find that habit" />;

  const { habit, streak, consistency, weekly } = data;
  const unit = streak.unit === "week" ? "weeks" : "days";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/habits">
          <ArrowLeft aria-hidden="true" /> All habits
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <HabitIcon icon={habit.icon} color={habit.color} size="lg" />
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{habit.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{habit.categoryLabel}</Badge>
              <Badge variant="outline">{habit.scheduleLabel}</Badge>
              {habit.targetValue ? <Badge variant="outline">{habit.targetValue} {habit.targetUnit} per day</Badge> : null}
              {habit.isArchived ? <Badge>Archived</Badge> : null}
            </div>
            {habit.description ? <p className="max-w-prose text-sm text-muted-foreground">{habit.description}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/habits/${habit.id}/edit`}>
              <Pencil aria-hidden="true" /> Edit
            </Link>
          </Button>
          <Button variant="outline" disabled={archive.isPending} onClick={() => archive.mutate({ id: habit.id, archived: !habit.isArchived })}>
            {habit.isArchived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
            {habit.isArchived ? "Reactivate" : "Archive"}
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden="true" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Current streak" icon={Flame} value={`${streak.current} ${streak.current === 1 ? unit.slice(0, -1) : unit}`} hint={streak.currentRun ? `Since ${formatDate(streak.currentRun.start, { month: "short", day: "numeric" })}` : "Complete it to start one"} />
        <StatCard label="Longest streak" icon={Trophy} value={`${streak.longest} ${streak.longest === 1 ? unit.slice(0, -1) : unit}`} hint={streak.longestRun ? `${formatDate(streak.longestRun.start, { month: "short", day: "numeric" })} – ${formatDate(streak.longestRun.end, { month: "short", day: "numeric" })}` : undefined} />
        <StatCard label="Total completed" icon={Check} value={streak.totalCompletions} hint={streak.lastCompletedOn ? `Last on ${formatDate(streak.lastCompletedOn, { month: "short", day: "numeric" })}` : "No completions yet"} />
      </div>

      {weekly ? (
        <Card className="card-soft rounded-2xl p-4">
          <p className="text-sm">
            This week: <strong className="tabular-nums">{weekly.count}</strong> of <strong className="tabular-nums">{weekly.target}</strong> completed
          </p>
          <Progress value={Math.min(100, (weekly.count / weekly.target) * 100)} className="mt-2 h-2" aria-label="This week's progress" />
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-soft rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle>Last 30 days</CardTitle>
            <CardDescription>Each square is a day, oldest first</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentGrid detail={data} />
          </CardContent>
        </Card>
        <Card className="card-soft rounded-2xl">
          <CardHeader>
            <CardTitle>Consistency</CardTitle>
            <CardDescription>Share of scheduled days completed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Consistency label="Last 7 days" value={consistency.last7} />
            <Consistency label="Last 30 days" value={consistency.last30} />
            <Consistency label="All time" value={consistency.allTime} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-soft rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Every logged day, newest first</CardDescription>
          </CardHeader>
          <CardContent>
            <History habitId={habit.id} />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="card-soft rounded-2xl">
            <CardHeader>
              <CardTitle>Streak history</CardTitle>
              <CardDescription>Your most recent runs</CardDescription>
            </CardHeader>
            <CardContent>
              {streak.recentRuns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No streaks yet.</p>
              ) : (
                <ul className="space-y-2.5 text-sm">
                  {streak.recentRuns.map((run) => (
                    <li key={`${run.start}-${run.end}`} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {formatDate(run.start, { month: "short", day: "numeric" })} – {formatDate(run.end, { month: "short", day: "numeric" })}
                      </span>
                      <span className="font-medium tabular-nums">
                        {run.length} {run.length === 1 ? unit.slice(0, -1) : unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="card-soft rounded-2xl">
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" /> Started {formatDate(habit.startDate, { month: "long", day: "numeric", year: "numeric" })}
              </p>
              <p className="flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
                {habit.reminderTime ? `Reminder at ${habit.reminderTime}` : "No reminder"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${habit.name}”?`}
        description="This permanently removes the habit, all of its history and any goals linked to it. This can't be undone. Archive it instead if you only want to pause it."
        confirmLabel="Delete habit"
        pending={del.isPending}
        onConfirm={() => del.mutate(habit.id, { onSuccess: () => router.replace("/habits") })}
      />
    </div>
  );
}
