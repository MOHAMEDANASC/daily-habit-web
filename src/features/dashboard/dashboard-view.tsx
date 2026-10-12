"use client";

import { CheckCircle2, Flame, ListTodo, Plus, Sparkles, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/components/layout/user-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { HabitIcon } from "@/components/shared/habit-icon";
import { PageHeader } from "@/components/shared/page-header";
import { ProgressRing } from "@/components/shared/progress-ring";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/features/dashboard/hooks";
import { WeekChart } from "@/features/dashboard/week-chart";
import { HabitCheckRow } from "@/features/tracker/habit-check-row";
import { formatDate } from "@/shared/dates";
import type { DashboardDTO } from "@/shared/api-types";

function greetingFor(timeZone: string): string {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(new Date()));
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

function StreakCard({ data }: { data: DashboardDTO }) {
  const { perfectDay, topHabits } = data.streaks;
  const active = topHabits.filter((h) => h.current > 0);
  return (
    <Card className="card-soft rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-5 text-warning" aria-hidden="true" /> Streaks
        </CardTitle>
        <CardDescription>A perfect day means every scheduled habit got done.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/60 p-3">
            <dt className="text-xs text-muted-foreground">Current streak</dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {perfectDay.current}
              <span className="ml-1 text-sm font-normal text-muted-foreground">{perfectDay.current === 1 ? "day" : "days"}</span>
            </dd>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <dt className="text-xs text-muted-foreground">Longest streak</dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {perfectDay.longest}
              <span className="ml-1 text-sm font-normal text-muted-foreground">{perfectDay.longest === 1 ? "day" : "days"}</span>
            </dd>
          </div>
        </dl>
        <div>
          <h3 className="mb-2 text-sm font-medium">Best habit streaks</h3>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">Complete a habit today to start your first streak.</p>
          ) : (
            <ul className="space-y-2">
              {active.map((habit) => (
                <li key={habit.habitId}>
                  <Link href={`/habits/${habit.habitId}`} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted">
                    <HabitIcon icon={habit.icon} color={habit.color} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{habit.name}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {habit.current} {habit.unit}
                      {habit.current === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity({ items }: { items: DashboardDTO["recentActivity"] }) {
  return (
    <Card className="card-soft rounded-2xl">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Your latest completions</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet. Check off a habit and it will show up here.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <HabitIcon icon={item.habitIcon} color={item.habitColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.habitName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.date, { weekday: "short", month: "short", day: "numeric" })}
                    {item.progressValue !== null && item.targetUnit ? ` · ${item.progressValue} ${item.targetUnit}` : ""}
                  </p>
                </div>
                <CheckCircle2 className="size-4 text-success" aria-label="Completed" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardView() {
  const user = useUser();
  const { data, isPending, isError, error, refetch } = useDashboard();
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greetingFor(user.timeZone)}, ${firstName}`}
        description={data ? formatDate(data.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : " "}
        actions={
          <Button asChild>
            <Link href="/habits/new">
              <Plus aria-hidden="true" /> New habit
            </Link>
          </Button>
        }
      />

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.totals.activeHabits === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Let's build your first habit"
          description="Pick something small like reading for 10 minutes or drinking water. Check it off each day and watch your streak grow."
          action={
            <Button asChild size="lg">
              <Link href="/habits/new">
                <Plus aria-hidden="true" /> Create a habit
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="card-soft flex-row items-center gap-4 rounded-2xl p-4 sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-start lg:p-5">
              <ProgressRing value={data.totals.percentage} size={84} strokeWidth={9} label="Today's completion">
                <span className="text-lg font-semibold tabular-nums">{data.totals.percentage}%</span>
              </ProgressRing>
              <div>
                <p className="text-sm text-muted-foreground">Today's completion</p>
                <p className="text-lg font-semibold">
                  {data.totals.scheduledToday === 0 ? "Nothing scheduled" : `${data.totals.completedToday} of ${data.totals.scheduledToday} done`}
                </p>
              </div>
            </Card>
            <StatCard label="Active habits" value={data.totals.activeHabits} icon={Target} hint="Habits you're tracking" />
            <StatCard label="Completed today" value={data.totals.completedToday} icon={CheckCircle2} hint={`${data.totalCompletions} completed all time`} />
            <StatCard
              label="Remaining today"
              value={data.totals.remainingToday}
              icon={ListTodo}
              hint={data.totals.remainingToday === 0 && data.totals.scheduledToday > 0 ? "You're all caught up" : "Scheduled habits left"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="card-soft rounded-2xl lg:col-span-2">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>Today's habits</CardTitle>
                  <CardDescription>Check things off without leaving the dashboard</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/tracker">Open tracker</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.todayHabits.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No habits are scheduled for today.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {data.todayHabits.map((habit) => (
                      <li key={habit.id}>
                        <HabitCheckRow habit={habit} date={data.date} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <StreakCard data={data} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="card-soft rounded-2xl lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="size-5 text-primary" aria-hidden="true" /> This week
                </CardTitle>
                <CardDescription>
                  {data.weekProgress.scheduled === 0
                    ? "No habits were scheduled so far this week."
                    : `${data.weekProgress.completed} of ${data.weekProgress.scheduled} completed so far (${data.weekProgress.percentage}%)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeekChart days={data.week} today={data.date} />
              </CardContent>
            </Card>
            <RecentActivity items={data.recentActivity} />
          </div>
        </>
      )}
    </div>
  );
}
