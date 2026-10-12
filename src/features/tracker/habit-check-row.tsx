"use client";

import { motion } from "framer-motion";
import { Check, Flame, NotebookPen, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { HabitIcon } from "@/components/shared/habit-icon";
import { Button } from "@/components/ui/button";
import { useSetCompletion, useUndoCompletion } from "@/features/completions/hooks";
import { LogDialog } from "@/features/tracker/log-dialog";
import { cn } from "@/lib/utils";
import type { HabitStateDTO } from "@/shared/api-types";

interface HabitCheckRowProps {
  habit: HabitStateDTO;
  date: string;
  /** Days that have not happened yet cannot be logged. */
  readOnly?: boolean;
}

function formatAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

export function HabitCheckRow({ habit, date, readOnly = false }: HabitCheckRowProps) {
  const setCompletion = useSetCompletion();
  const undo = useUndoCompletion();
  const [logOpen, setLogOpen] = useState(false);

  const done = habit.state === "done";
  const measurable = habit.targetValue !== null;
  const progressPct = measurable && habit.targetValue ? Math.min(100, ((habit.progressValue ?? 0) / habit.targetValue) * 100) : 0;
  const busy = setCompletion.isPending || undo.isPending;

  function toggle() {
    if (readOnly || habit.isArchived) return;
    if (done) undo.mutate({ habitId: habit.id, date });
    else setCompletion.mutate({ habitId: habit.id, date, completed: true });
  }

  return (
    <div
      className={cn(
        "card-soft flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors sm:gap-4 sm:p-4",
        done && "bg-muted/40",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={readOnly || busy || habit.isArchived}
        aria-pressed={done}
        aria-label={done ? `Undo completion of ${habit.name}` : `Mark ${habit.name} as done`}
        className={cn(
          "relative flex size-12 shrink-0 items-center justify-center rounded-full border-2 outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:size-11",
        )}
        style={{ borderColor: habit.color, backgroundColor: done ? habit.color : "transparent" }}
      >
        {done ? (
          <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
            <Check className="size-6 text-white" strokeWidth={3} aria-hidden="true" />
          </motion.span>
        ) : measurable && progressPct > 0 ? (
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: habit.color }} aria-hidden="true">
            {Math.round(progressPct)}%
          </span>
        ) : null}
      </button>

      <HabitIcon icon={habit.icon} color={habit.color} className="hidden sm:inline-flex" />

      <div className="min-w-0 flex-1">
        <Link href={`/habits/${habit.id}`} className={cn("block truncate font-medium hover:underline", done && "text-muted-foreground line-through decoration-1")}>
          {habit.name}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {measurable ? (
            <span className="tabular-nums">
              {formatAmount(habit.progressValue ?? 0)} / {formatAmount(habit.targetValue ?? 0)} {habit.targetUnit}
            </span>
          ) : (
            <span>{habit.scheduleLabel}</span>
          )}
          {habit.weekly ? (
            <span className="tabular-nums">
              {habit.weekly.count}/{habit.weekly.target} this week
            </span>
          ) : null}
          {habit.streak.current > 0 ? (
            <span className="inline-flex items-center gap-1 font-medium text-warning">
              <Flame className="size-3.5" aria-hidden="true" />
              {habit.streak.current} {habit.streak.unit}
              {habit.streak.current === 1 ? "" : "s"}
              <span className="sr-only"> streak</span>
            </span>
          ) : null}
        </div>
        {measurable && !done && progressPct > 0 ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: habit.color }} />
          </div>
        ) : null}
        {habit.notes ? <p className="mt-1.5 line-clamp-2 text-xs italic text-muted-foreground">“{habit.notes}”</p> : null}
      </div>

      {!readOnly && !habit.isArchived ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLogOpen(true)}
          aria-label={measurable ? `Log an amount or note for ${habit.name}` : `Add a note for ${habit.name}`}
          className="shrink-0"
        >
          {measurable ? <SlidersHorizontal aria-hidden="true" /> : <NotebookPen aria-hidden="true" />}
        </Button>
      ) : null}

      {logOpen ? <LogDialog key={`${habit.id}-${date}`} habit={habit} date={date} open={logOpen} onOpenChange={setLogOpen} /> : null}
    </div>
  );
}
