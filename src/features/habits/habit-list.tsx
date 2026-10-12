"use client";

import { Archive, ArchiveRestore, CheckCircle2, Circle, Flame, MoreHorizontal, Pencil, Plus, Search, Target, Trash2 } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { HabitIcon } from "@/components/shared/habit-icon";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES } from "@/shared/habits";
import { useArchiveHabit, useDeleteHabit, useHabits, type HabitFilters } from "@/features/habits/hooks";
import type { HabitStateDTO } from "@/shared/api-types";

const STATUS_TABS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Done today" },
  { value: "incomplete", label: "To do today" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const;

const SORTS = [
  { value: "created:desc", label: "Newest first" },
  { value: "created:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "status:asc", label: "To do first" },
  { value: "status:desc", label: "Done first" },
] as const;

function HabitCard({ habit, onDelete }: { habit: HabitStateDTO; onDelete: (habit: HabitStateDTO) => void }) {
  const archive = useArchiveHabit();
  const done = habit.state === "done";
  return (
    <Card className="card-soft flex-row items-center gap-3 rounded-2xl p-3 sm:gap-4 sm:p-4">
      <HabitIcon icon={habit.icon} color={habit.color} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={`/habits/${habit.id}`} className="truncate font-medium hover:underline">
            {habit.name}
          </Link>
          {habit.isArchived ? <Badge variant="secondary">Archived</Badge> : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{habit.categoryLabel}</span>
          <span>{habit.scheduleLabel}</span>
          {habit.targetValue ? (
            <span>
              {habit.targetValue} {habit.targetUnit}/day
            </span>
          ) : null}
          {habit.streak.current > 0 ? (
            <span className="inline-flex items-center gap-1 font-medium text-warning">
              <Flame className="size-3.5" aria-hidden="true" /> {habit.streak.current} {habit.streak.unit}
              {habit.streak.current === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </div>
      {!habit.isArchived && habit.availableOnDate ? (
        <span className={done ? "inline-flex items-center gap-1 text-xs font-medium text-success" : "inline-flex items-center gap-1 text-xs text-muted-foreground"}>
          {done ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <Circle className="size-4" aria-hidden="true" />}
          <span className="hidden sm:inline">{done ? "Done today" : "Not yet"}</span>
          <span className="sr-only sm:hidden">{done ? "Done today" : "Not done yet today"}</span>
        </span>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${habit.name}`}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/habits/${habit.id}`}>
              <Target aria-hidden="true" /> View details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/habits/${habit.id}/edit`}>
              <Pencil aria-hidden="true" /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => archive.mutate({ id: habit.id, archived: !habit.isArchived })}>
            {habit.isArchived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
            {habit.isArchived ? "Reactivate" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(habit)}>
            <Trash2 aria-hidden="true" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}

export function HabitList() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [status, setStatus] = useState<NonNullable<HabitFilters["status"]>>("active");
  const [category, setCategory] = useState("all");
  const [sortKey, setSortKey] = useState<(typeof SORTS)[number]["value"]>("created:desc");
  const [toDelete, setToDelete] = useState<HabitStateDTO | null>(null);
  const del = useDeleteHabit();

  const [sort, order] = sortKey.split(":") as [NonNullable<HabitFilters["sort"]>, NonNullable<HabitFilters["order"]>];
  const filters: HabitFilters = { q: deferredSearch || undefined, status, category: category === "all" ? undefined : category, sort, order };
  const { data, isPending, isError, error, refetch, isFetching } = useHabits(filters);
  const hasFilters = Boolean(deferredSearch) || category !== "all" || status !== "active";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habits"
        description="Everything you're building, in one place."
        actions={
          <Button asChild>
            <Link href="/habits/new">
              <Plus aria-hidden="true" /> New habit
            </Link>
          </Button>
        }
      />

      <div className="space-y-3">
        <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <TabsList className="h-auto w-full flex-wrap justify-start sm:w-auto">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="min-h-9 px-3">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="grid gap-2 sm:grid-cols-[1fr_12rem_12rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search habits by name" aria-label="Search habits by name" className="h-10 pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-10 w-full" aria-label="Filter by category">
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
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as typeof sortKey)}>
            <SelectTrigger className="h-10 w-full" aria-label="Sort habits">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div aria-live="polite" className={isFetching && !isPending ? "opacity-70 transition-opacity" : "transition-opacity"}>
        {isPending ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : data.length === 0 ? (
          hasFilters ? (
            <EmptyState icon={Search} title="No habits match" description="Try a different search or clear the filters." action={<Button variant="outline" onClick={() => { setSearch(""); setCategory("all"); setStatus("active"); }}>Clear filters</Button>} />
          ) : (
            <EmptyState
              icon={Target}
              title="No habits yet"
              description="Start with one small habit you can do every day."
              action={
                <Button asChild>
                  <Link href="/habits/new">
                    <Plus aria-hidden="true" /> Create a habit
                  </Link>
                </Button>
              }
            />
          )
        ) : (
          <ul className="space-y-3">
            {data.map((habit) => (
              <li key={habit.id}>
                <HabitCard habit={habit} onDelete={setToDelete} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete “${toDelete?.name ?? ""}”?`}
        description="This permanently removes the habit and its entire completion history, goals linked to it, and its streaks. If you just want to pause it, archive it instead."
        confirmLabel="Delete habit"
        pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
