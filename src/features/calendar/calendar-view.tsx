"use client";

import { Check, ChevronLeft, ChevronRight, CircleDashed, Minus, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/layout/user-context";
import { ErrorState } from "@/components/shared/error-state";
import { HabitIcon } from "@/components/shared/habit-icon";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WEEKDAY_LABELS, WEEKDAY_NAMES } from "@/shared/habits";
import { useDaily } from "@/features/completions/hooks";
import { useCalendar } from "@/features/dashboard/hooks";
import { addMonths, formatDate, isDateString, isMonthKey, todayInTimeZone, weekdayOf } from "@/shared/dates";
import { cn } from "@/lib/utils";
import type { CalendarDayDTO, DayStatus } from "@/shared/api-types";

const STATUS: Record<DayStatus, { label: string; icon: typeof Check | null; tone: string }> = {
  complete: { label: "All done", icon: Check, tone: "bg-success/15 text-success border-success/30" },
  partial: { label: "Partly done", icon: Minus, tone: "bg-warning/15 text-warning border-warning/30" },
  missed: { label: "Nothing done", icon: X, tone: "bg-destructive/10 text-destructive border-destructive/25" },
  none: { label: "Nothing scheduled", icon: null, tone: "bg-transparent text-muted-foreground border-transparent" },
};

function DayCell({ day, selected, onSelect }: { day: CalendarDayDTO; selected: boolean; onSelect: () => void }) {
  const status = STATUS[day.status];
  const Icon = status.icon;
  const upcoming = day.isFuture;
  const label = upcoming
    ? `${formatDate(day.date)}: upcoming${day.scheduled ? `, ${day.scheduled} scheduled` : ""}`
    : `${formatDate(day.date)}: ${status.label}${day.scheduled ? `, ${day.completed} of ${day.scheduled}` : ""}${day.isToday ? " (today)" : ""}`;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={selected}
      aria-current={day.isToday ? "date" : undefined}
      className={cn(
        "relative flex min-h-14 flex-col items-center justify-between rounded-xl border p-1.5 text-center transition-colors hover:bg-muted sm:min-h-20 sm:items-start sm:p-2",
        upcoming ? "border-transparent text-muted-foreground" : status.tone,
        day.isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        selected && "outline outline-2 outline-offset-1 outline-foreground",
      )}
    >
      <span className={cn("text-sm font-semibold tabular-nums", day.isToday && "text-primary")}>{Number(day.date.slice(8))}</span>
      {!upcoming && day.scheduled > 0 ? (
        <span className="flex items-center gap-1 text-[11px] font-medium tabular-nums sm:text-xs">
          {Icon ? <Icon className="size-3.5" strokeWidth={3} aria-hidden="true" /> : null}
          <span className="hidden sm:inline">
            {day.completed}/{day.scheduled}
          </span>
        </span>
      ) : upcoming && day.scheduled > 0 ? (
        <CircleDashed className="size-3.5 opacity-60" aria-hidden="true" />
      ) : (
        <span aria-hidden="true" className="h-4" />
      )}
    </button>
  );
}

function DayPanel({ date }: { date: string }) {
  const { data, isPending, isError, error, refetch } = useDaily(date);
  return (
    <Card className="card-soft rounded-2xl">
      <CardHeader>
        <CardTitle>{formatDate(date, { weekday: "long", month: "long", day: "numeric" })}</CardTitle>
        <CardDescription>
          {data
            ? data.summary.scheduled === 0
              ? "Nothing scheduled"
              : `${data.summary.completed} of ${data.summary.scheduled} done · ${data.summary.percentage}%`
            : " "}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : data.habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No habits were scheduled on this day.</p>
        ) : (
          <ul className="space-y-2">
            {data.habits.map((habit) => (
              <li key={habit.id} className="flex items-center gap-3">
                <HabitIcon icon={habit.icon} color={habit.color} size="sm" />
                <Link href={`/habits/${habit.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
                  {habit.name}
                </Link>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    habit.state === "done" ? "bg-success/15 text-success" : habit.state === "partial" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground",
                  )}
                >
                  {habit.state === "done" ? <Check className="size-3" strokeWidth={3} aria-hidden="true" /> : habit.state === "partial" ? <Minus className="size-3" strokeWidth={3} aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
                  {habit.state === "done" ? "Done" : habit.state === "partial" ? "Partial" : data.isFuture ? "Upcoming" : "Not done"}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!data?.isFuture ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/tracker?date=${date}`}>Open this day in the tracker</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CalendarView() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const today = todayInTimeZone(user.timeZone);
  const requestedMonth = params.get("month");
  const month = requestedMonth && isMonthKey(requestedMonth) ? requestedMonth : today.slice(0, 7);
  const requestedDate = params.get("date");
  const selected = requestedDate && isDateString(requestedDate) && requestedDate.startsWith(month) ? requestedDate : month === today.slice(0, 7) ? today : `${month}-01`;

  const { data, isPending, isError, error, refetch } = useCalendar(month);

  function go(next: { month?: string; date?: string }) {
    const search = new URLSearchParams();
    search.set("month", next.month ?? month);
    if (next.date) search.set("date", next.date);
    router.replace(`${pathname}?${search.toString()}`, { scroll: false });
  }

  const orderedWeekdays = Array.from({ length: 7 }, (_, i) => (i + user.weekStartsOn) % 7);
  const leading = data ? (weekdayOf(`${month}-01`) - user.weekStartsOn + 7) % 7 : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" description="See how consistent you've been, day by day." />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="card-soft rounded-2xl p-3 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold" aria-live="polite">
              {formatDate(`${month}-01`, { month: "long", year: "numeric" })}
            </h2>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" onClick={() => go({ month: addMonths(month, -1) })} aria-label="Previous month">
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Button variant="outline" onClick={() => go({ month: today.slice(0, 7), date: today })} disabled={month === today.slice(0, 7)}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => go({ month: addMonths(month, 1) })} aria-label="Next month">
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>

          {isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <>
              <div className="mb-1.5 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted-foreground" aria-hidden="true">
                {orderedWeekdays.map((d) => (
                  <div key={d}>{WEEKDAY_LABELS[d]}</div>
                ))}
              </div>
              {isPending ? (
                <div className="grid grid-cols-7 gap-1.5" aria-busy="true">
                  {Array.from({ length: 35 }, (_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl sm:h-20" />
                  ))}
                </div>
              ) : (
                <div role="group" aria-label={`Days of ${formatDate(`${month}-01`, { month: "long", year: "numeric" })}. Weeks start on ${WEEKDAY_NAMES[user.weekStartsOn]}.`} className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: leading }, (_, i) => (
                    <div key={`pad-${i}`} aria-hidden="true" />
                  ))}
                  {data.days.map((day) => (
                    <DayCell key={day.date} day={day} selected={day.date === selected} onSelect={() => go({ date: day.date })} />
                  ))}
                </div>
              )}
            </>
          )}

          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs text-muted-foreground" aria-label="Legend">
            <li className="inline-flex items-center gap-1.5"><span className="flex size-5 items-center justify-center rounded-md border border-success/30 bg-success/15 text-success"><Check className="size-3" strokeWidth={3} aria-hidden="true" /></span> All done</li>
            <li className="inline-flex items-center gap-1.5"><span className="flex size-5 items-center justify-center rounded-md border border-warning/30 bg-warning/15 text-warning"><Minus className="size-3" strokeWidth={3} aria-hidden="true" /></span> Partly done</li>
            <li className="inline-flex items-center gap-1.5"><span className="flex size-5 items-center justify-center rounded-md border border-destructive/25 bg-destructive/10 text-destructive"><X className="size-3" strokeWidth={3} aria-hidden="true" /></span> Nothing done</li>
            <li className="inline-flex items-center gap-1.5"><span className="size-5 rounded-md border border-dashed" aria-hidden="true" /> Nothing scheduled</li>
            <li className="inline-flex items-center gap-1.5"><span className="size-5 rounded-md ring-2 ring-primary" aria-hidden="true" /> Today</li>
          </ul>
        </Card>

        <DayPanel date={selected} />
      </div>
    </div>
  );
}
