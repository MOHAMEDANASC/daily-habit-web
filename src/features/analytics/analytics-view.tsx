"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, CheckCircle2, Flame, Percent, Star, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useUser } from "@/components/layout/user-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { HabitIcon } from "@/components/shared/habit-icon";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES } from "@/shared/habits";
import { CategoryChart, CumulativeChart, TrendChart } from "@/features/analytics/charts";
import { useAnalytics } from "@/features/dashboard/hooks";
import { useHabits } from "@/features/habits/hooks";
import { addDays, formatDate, todayInTimeZone } from "@/shared/dates";
import { cn } from "@/lib/utils";
import type { HabitReportDTO } from "@/shared/api-types";

const PRESETS = [
  { value: "7", label: "7 days", days: 7 },
  { value: "30", label: "30 days", days: 30 },
  { value: "90", label: "90 days", days: 90 },
  { value: "365", label: "1 year", days: 365 },
  { value: "custom", label: "Custom", days: 0 },
] as const;

/** Change versus the previous period, shown with an arrow and words, never colour alone. */
function Delta({ current, previous, unit = "", invert = false }: { current: number | null; previous: number | null; unit?: string; invert?: boolean }) {
  if (current === null || previous === null) return <span className="text-xs text-muted-foreground">No earlier period to compare</span>;
  const diff = Math.round((current - previous) * 10) / 10;
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowRight className="size-3.5" aria-hidden="true" /> Same as previous period
      </span>
    );
  }
  const good = invert ? diff < 0 : diff > 0;
  const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", good ? "text-success" : "text-destructive")}>
      <Icon className="size-3.5" aria-hidden="true" />
      {diff > 0 ? "+" : ""}
      {diff}
      {unit} <span className="font-normal text-muted-foreground">vs previous period</span>
    </span>
  );
}

function Kpi({ label, value, icon: Icon, children }: { label: string; value: string; icon: typeof Percent; children: React.ReactNode }) {
  return (
    <Card className="card-soft gap-1 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="text-2xl font-semibold tabular-nums sm:text-3xl">{value}</div>
      {children}
    </Card>
  );
}

function RankList({ title, description, icon: Icon, habits, empty }: { title: string; description: string; icon: typeof Star; habits: HabitReportDTO[]; empty: string }) {
  return (
    <Card className="card-soft rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-5 text-primary" aria-hidden="true" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ol className="space-y-3">
            {habits.map((h) => (
              <li key={h.id}>
                <Link href={`/habits/${h.id}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-muted">
                  <HabitIcon icon={h.icon} color={h.color} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{h.name}</span>
                  <span className="text-sm font-semibold tabular-nums">{h.rate}%</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsView() {
  const user = useUser();
  const today = todayInTimeZone(user.timeZone);
  const [preset, setPreset] = useState<(typeof PRESETS)[number]["value"]>("30");
  const [custom, setCustom] = useState({ from: addDays(today, -29), to: today });
  const [habitId, setHabitId] = useState("all");
  const [category, setCategory] = useState("all");
  const [grouping, setGrouping] = useState<"day" | "week" | "month">("day");

  const range = useMemo(() => {
    if (preset === "custom") return custom.from > custom.to ? { from: custom.to, to: custom.to } : custom;
    const days = PRESETS.find((p) => p.value === preset)?.days ?? 30;
    return { from: addDays(today, -(days - 1)), to: today };
  }, [preset, custom, today]);

  const filters = { ...range, habitId: habitId === "all" ? undefined : habitId, category: category === "all" ? undefined : category };
  const { data, isPending, isError, error, refetch, isFetching } = useAnalytics(filters);
  const { data: habitOptions } = useHabits({ status: "all", sort: "name", order: "asc" });
  const rangeInvalid = preset === "custom" && custom.from > custom.to;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Real numbers from your completion history." />

      <Card className="card-soft rounded-2xl p-4">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Period</Label>
            <Tabs value={preset} onValueChange={(v) => setPreset(v as typeof preset)}>
              <TabsList>
                {PRESETS.map((p) => (
                  <TabsTrigger key={p.value} value={p.value} className="min-h-9 px-3">
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          {preset === "custom" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="from" className="text-xs text-muted-foreground">From</Label>
                <Input id="from" type="date" min={addDays(custom.to, -399)} max={custom.to} value={custom.from} onChange={(e) => e.target.value && setCustom((c) => ({ ...c, from: e.target.value }))} className="h-10 w-40" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to" className="text-xs text-muted-foreground">To</Label>
                <Input id="to" type="date" min={custom.from} max={today} value={custom.to} onChange={(e) => e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))} className="h-10 w-40" />
              </div>
            </>
          ) : null}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Habit</Label>
            <Select value={habitId} onValueChange={setHabitId}>
              <SelectTrigger className="h-10 w-48" aria-label="Filter by habit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All habits</SelectItem>
                {(habitOptions ?? []).map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 w-48" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {rangeInvalid ? <p role="alert" className="mt-3 text-sm text-destructive">The start date must be on or before the end date.</p> : null}
      </Card>

      {isPending ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading analytics">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <div className={cn("space-y-6 transition-opacity", isFetching && "opacity-60")}>
          <p className="text-sm text-muted-foreground">
            {formatDate(data.range.from, { month: "short", day: "numeric", year: "numeric" })} – {formatDate(data.range.to, { month: "short", day: "numeric", year: "numeric" })} ({data.range.days} days), compared with the {data.range.days} days before.
          </p>

          {!data.hasEnoughData ? (
            <EmptyState
              icon={BarChart3}
              title="Not enough history yet"
              description="Analytics become meaningful after a few days of tracking. Keep checking in, or widen the period."
              action={
                <Link href="/tracker" className="text-sm font-medium text-primary hover:underline">
                  Go to today's habits
                </Link>
              }
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Completions" value={String(data.totals.completions)} icon={CheckCircle2}>
              <Delta current={data.totals.completions} previous={data.totals.previousCompletions} />
            </Kpi>
            <Kpi label="Completion rate" value={data.totals.rate === null ? "–" : `${data.totals.rate}%`} icon={Percent}>
              <Delta current={data.totals.rate} previous={data.totals.previousRate} unit=" pts" />
            </Kpi>
            <Kpi label="Perfect days" value={String(data.totals.perfectDays)} icon={Star}>
              <span className="text-xs text-muted-foreground">Every scheduled habit done</span>
            </Kpi>
            <Kpi label="Active days" value={String(data.totals.activeDays)} icon={Flame}>
              <span className="text-xs text-muted-foreground">Days with something scheduled</span>
            </Kpi>
          </div>

          {data.totals.activeDays > 0 ? (
            <>
              <Card className="card-soft rounded-2xl">
                <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Completion rate</CardTitle>
                    <CardDescription>Share of scheduled habits completed, by {grouping}</CardDescription>
                  </div>
                  <Tabs value={grouping} onValueChange={(v) => setGrouping(v as typeof grouping)}>
                    <TabsList>
                      <TabsTrigger value="day" className="min-h-9 px-3">Daily</TabsTrigger>
                      <TabsTrigger value="week" className="min-h-9 px-3">Weekly</TabsTrigger>
                      <TabsTrigger value="month" className="min-h-9 px-3">Monthly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  <TrendChart points={data.series[grouping]} grouping={grouping} />
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="card-soft rounded-2xl">
                  <CardHeader>
                    <CardTitle>Total completions over time</CardTitle>
                    <CardDescription>Cumulative habit-days completed, all time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CumulativeChart points={data.cumulative} />
                  </CardContent>
                </Card>
                <Card className="card-soft rounded-2xl">
                  <CardHeader>
                    <CardTitle>Progress by category</CardTitle>
                    <CardDescription>Completion rate in this period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.categories.length === 0 ? <p className="text-sm text-muted-foreground">No scheduled habits in this period.</p> : <CategoryChart categories={data.categories} />}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <RankList title="Best performing" description="Your most consistent habits (50%+)" icon={Star} habits={data.best} empty="No habit has reached 50% with enough scheduled days yet." />
                <RankList title="Needs improvement" description="Habits below 80% this period" icon={TrendingDown} habits={data.needsImprovement} empty="Nothing below 80%. Nice work." />
              </div>

              <Card className="card-soft rounded-2xl">
                <CardHeader>
                  <CardTitle>Habit-wise completion</CardTitle>
                  <CardDescription>Rate for this period, compared with the previous one</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <caption className="sr-only">Completion rate per habit</caption>
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th scope="col" className="py-2 pr-3 font-medium">Habit</th>
                          <th scope="col" className="py-2 pr-3 font-medium">Rate</th>
                          <th scope="col" className="py-2 pr-3 font-medium">Done / expected</th>
                          <th scope="col" className="py-2 pr-3 font-medium">Change</th>
                          <th scope="col" className="py-2 font-medium">Streak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.habits.map((h) => (
                          <tr key={h.id} className="border-b last:border-0">
                            <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                              <Link href={`/habits/${h.id}`} className="inline-flex items-center gap-2 hover:underline">
                                <HabitIcon icon={h.icon} color={h.color} size="sm" /> {h.name}
                              </Link>
                            </th>
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                                  <div className="h-full rounded-full" style={{ width: `${h.rate ?? 0}%`, backgroundColor: h.color }} />
                                </div>
                                <span className="tabular-nums">{h.rate === null ? "–" : `${h.rate}%`}</span>
                              </div>
                            </td>
                            <td className="py-2.5 pr-3 tabular-nums">
                              {h.actual} / {h.expected}
                            </td>
                            <td className="py-2.5 pr-3">
                              <Delta current={h.rate} previous={h.previousRate} unit=" pts" />
                            </td>
                            <td className="py-2.5 tabular-nums">
                              {h.streak.current} / {h.streak.longest} {h.streak.unit}s
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
