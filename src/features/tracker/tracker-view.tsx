"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/layout/user-context";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDaily } from "@/features/completions/hooks";
import { DateStrip } from "@/features/tracker/date-strip";
import { DaySummary } from "@/features/tracker/day-summary";
import { HabitCheckRow } from "@/features/tracker/habit-check-row";
import { formatDate, isDateString, todayInTimeZone } from "@/shared/dates";
import type { HabitStateDTO } from "@/shared/api-types";

function Section({ title, count, habits, date, readOnly, hint }: { title: string; count: number; habits: HabitStateDTO[]; date: string; readOnly: boolean; hint?: string }) {
  if (habits.length === 0) return null;
  return (
    <section aria-labelledby={`section-${title}`} className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`section-${title}`} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title} <span className="tabular-nums">({count})</span>
        </h2>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <ul className="space-y-2.5">
        <AnimatePresence initial={false}>
          {habits.map((habit) => (
            <motion.li key={habit.id} layout="position" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <HabitCheckRow habit={habit} date={date} readOnly={readOnly} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

export function TrackerSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading habits">
      <Skeleton className="h-24 rounded-2xl" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-[74px] rounded-2xl" />
      ))}
    </div>
  );
}

export function TrackerView() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const today = todayInTimeZone(user.timeZone);
  const requested = params.get("date");
  const selected = requested && isDateString(requested) && requested <= today ? requested : today;

  const { data, isPending, isError, error, refetch } = useDaily(selected);

  function select(date: string) {
    const next = date > today ? today : date;
    router.replace(next === today ? pathname : `${pathname}?date=${next}`, { scroll: false });
  }

  const habits = data?.habits ?? [];
  const readOnly = selected > today;
  const todo = habits.filter((h) => h.state !== "done" && h.scheduledOnDate);
  const flexible = habits.filter((h) => h.state !== "done" && !h.scheduledOnDate);
  const completed = habits.filter((h) => h.state === "done");

  return (
    <div className="space-y-6">
      <PageHeader
        title={selected === today ? "Today" : formatDate(selected, { weekday: "long" })}
        description={formatDate(selected, { month: "long", day: "numeric", year: "numeric" })}
        actions={
          <Button asChild variant="outline">
            <Link href="/habits/new">
              <Plus aria-hidden="true" /> New habit
            </Link>
          </Button>
        }
      />

      <DateStrip selected={selected} today={today} onSelect={select} />

      {isPending ? (
        <TrackerSkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : habits.length === 0 && data.summary.scheduled === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No habits for this day"
          description="Create a habit to start tracking, or pick another day. Weekday-only habits won't show up on weekends."
          action={
            <Button asChild>
              <Link href="/habits/new">
                <Plus aria-hidden="true" /> Create your first habit
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-7">
          <DaySummary summary={data.summary} label={formatDate(selected, { month: "short", day: "numeric" })} />
          {readOnly ? <p className="text-sm text-muted-foreground">This day hasn't happened yet, so it can't be logged.</p> : null}
          <Section title="To do" count={todo.length} habits={todo} date={selected} readOnly={readOnly} />
          <Section title="Flexible weekly habits" count={flexible.length} habits={flexible} date={selected} readOnly={readOnly} hint="Do these on any day this week" />
          <Section title="Completed" count={completed.length} habits={completed} date={selected} readOnly={readOnly} />
        </div>
      )}
    </div>
  );
}
