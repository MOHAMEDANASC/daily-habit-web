"use client";

import { Archive, ArchiveRestore, CalendarClock, Check, CircleDot, MoreHorizontal, Pencil, Plus, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { HabitIcon } from "@/components/shared/habit-icon";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalFormDialog } from "@/features/goals/goal-form";
import { useArchiveGoal, useDeleteGoal, useGoals } from "@/features/goals/hooks";
import { formatDate } from "@/shared/dates";
import { cn } from "@/lib/utils";
import type { GoalDTO } from "@/shared/api-types";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function GoalCard({ goal, onEdit, onDelete }: { goal: GoalDTO; onEdit: (g: GoalDTO) => void; onDelete: (g: GoalDTO) => void }) {
  const archive = useArchiveGoal();
  const completed = goal.status === "COMPLETED";
  return (
    <Card className="card-soft gap-4 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {goal.habit ? <HabitIcon icon={goal.habit.icon} color={goal.habit.color} /> : <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground" aria-hidden="true"><Trophy className="size-5" /></span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{goal.title}</h3>
            {completed ? (
              <Badge className="gap-1 bg-success text-white">
                <Check className="size-3" strokeWidth={3} aria-hidden="true" /> Reached
              </Badge>
            ) : goal.status === "ARCHIVED" ? (
              <Badge variant="secondary">Archived</Badge>
            ) : goal.isOverdue ? (
              <Badge variant="destructive">Past deadline</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {goal.habit ? goal.habit.name : "All habits"}
            {goal.targetDate ? ` · by ${formatDate(goal.targetDate, { month: "short", day: "numeric", year: "numeric" })}` : ""}
            {goal.daysLeft !== null && goal.status === "ACTIVE" && goal.daysLeft >= 0 ? ` (${goal.daysLeft} ${goal.daysLeft === 1 ? "day" : "days"} left)` : ""}
          </p>
          {goal.description ? <p className="mt-1 text-sm">{goal.description}</p> : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${goal.title}`}>
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => onEdit(goal)}>
              <Pencil aria-hidden="true" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => archive.mutate({ id: goal.id, archived: goal.status !== "ARCHIVED" })}>
              {goal.status === "ARCHIVED" ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
              {goal.status === "ARCHIVED" ? "Reactivate" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(goal)}>
              <Trash2 aria-hidden="true" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold tabular-nums">
            {fmt(goal.currentValue)} <span className="font-normal text-muted-foreground">of {fmt(goal.targetValue)} {goal.unitLabel}</span>
          </span>
          <span className="tabular-nums text-muted-foreground">{Math.round(goal.progress * 100)}%</span>
        </div>
        <Progress value={goal.progress * 100} className="h-2.5" aria-label={`${goal.title} progress`} />
      </div>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Milestones">
        {goal.milestones.map((m) => (
          <li
            key={m.percent}
            className={cn("rounded-xl border px-3 py-2 text-xs", m.reached ? "border-success/30 bg-success/10" : "bg-muted/40 text-muted-foreground")}
          >
            <div className="flex items-center gap-1.5 font-medium">
              {m.reached ? <Check className="size-3.5 text-success" strokeWidth={3} aria-hidden="true" /> : <CircleDot className="size-3.5" aria-hidden="true" />}
              {m.percent}%
              <span className="sr-only">{m.reached ? " reached" : " not reached yet"}</span>
            </div>
            <div className="mt-0.5">
              {m.reached ? (m.reachedOn ? `Reached ${formatDate(m.reachedOn, { month: "short", day: "numeric" })}` : "Reached") : `at ${fmt(m.value)}`}
            </div>
          </li>
        ))}
      </ol>

      {completed && goal.completedAt ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" aria-hidden="true" /> Target reached on {formatDate(goal.completedAt.slice(0, 10), { month: "long", day: "numeric", year: "numeric" })}
        </p>
      ) : null}
    </Card>
  );
}

export function GoalsView() {
  const { data, isPending, isError, error, refetch } = useGoals();
  const [tab, setTab] = useState<"ACTIVE" | "COMPLETED" | "ARCHIVED">("ACTIVE");
  const [editing, setEditing] = useState<GoalDTO | "new" | null>(null);
  const [toDelete, setToDelete] = useState<GoalDTO | null>(null);
  const del = useDeleteGoal();

  const goals = (data ?? []).filter((g) => g.status === tab);
  const counts = { ACTIVE: 0, COMPLETED: 0, ARCHIVED: 0 };
  for (const g of data ?? []) counts[g.status]++;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals & milestones"
        description="Turn habits into targets and celebrate when you reach them."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" /> New goal
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="ACTIVE" className="min-h-9 px-3">Active ({counts.ACTIVE})</TabsTrigger>
          <TabsTrigger value="COMPLETED" className="min-h-9 px-3">Reached ({counts.COMPLETED})</TabsTrigger>
          <TabsTrigger value="ARCHIVED" className="min-h-9 px-3">Archived ({counts.ARCHIVED})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isPending ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={tab === "ACTIVE" ? "No active goals" : tab === "COMPLETED" ? "No goals reached yet" : "Nothing archived"}
          description={tab === "ACTIVE" ? "Set a target like “Meditate 30 days” or “Drink 8 glasses of water daily for a month”." : "Goals you reach show up here with the date you hit them."}
          action={
            tab === "ACTIVE" ? (
              <Button onClick={() => setEditing("new")}>
                <Plus aria-hidden="true" /> Create a goal
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-4">
          {goals.map((goal) => (
            <li key={goal.id}>
              <GoalCard goal={goal} onEdit={setEditing} onDelete={setToDelete} />
            </li>
          ))}
        </ul>
      )}

      {editing !== null ? (
        <GoalFormDialog key={editing === "new" ? "new" : editing.id} goal={editing === "new" ? undefined : editing} open onOpenChange={(open) => !open && setEditing(null)} />
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete “${toDelete?.title ?? ""}”?`}
        description="The goal and its milestones are removed. Your habit history is not affected."
        confirmLabel="Delete goal"
        pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
