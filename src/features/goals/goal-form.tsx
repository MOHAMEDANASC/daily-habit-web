"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { FormField, fieldProps } from "@/components/forms/form-field";
import { useUser } from "@/components/layout/user-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useHabits } from "@/features/habits/hooks";
import { useSaveGoal } from "@/features/goals/hooks";
import { todayInTimeZone } from "@/shared/dates";
import { applyServerError } from "@/lib/form-errors";
import { GOAL_METRICS, goalInputSchema, type GoalInput } from "@/shared/validations/goal";
import type { GoalDTO } from "@/shared/api-types";

type Values = z.input<typeof goalInputSchema>;

const ALL_HABITS = "__all__";

export function GoalFormDialog({ goal, open, onOpenChange }: { goal?: GoalDTO; open: boolean; onOpenChange: (open: boolean) => void }) {
  const user = useUser();
  const today = todayInTimeZone(user.timeZone);
  const { data: habits } = useHabits({ status: "active", sort: "name", order: "asc" });
  const save = useSaveGoal(goal?.id);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values, unknown, GoalInput>({
    resolver: zodResolver(goalInputSchema),
    defaultValues: goal
      ? {
          title: goal.title,
          description: goal.description ?? "",
          metric: goal.metric,
          habitId: goal.habit?.id ?? null,
          targetValue: goal.targetValue,
          startDate: goal.startDate,
          targetDate: goal.targetDate,
        }
      : { title: "", description: "", metric: "COMPLETIONS", habitId: null, targetValue: 30, startDate: today, targetDate: null },
  });

  const metric = useWatch({ control, name: "metric" });
  const selectableHabits = (habits ?? []).filter((h) => (metric === "QUANTITY" ? h.targetValue !== null : true));

  async function onSubmit(values: GoalInput) {
    try {
      await save.mutateAsync(values);
      onOpenChange(false);
    } catch (error) {
      applyServerError(error, setError);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "New goal"}</DialogTitle>
          <DialogDescription>Goals measure your progress from real completions, e.g. “Meditate 30 days” or “Read 600 pages”.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField id="goal-title" label="Title" required error={errors.title?.message}>
            <Input {...fieldProps("goal-title", errors.title?.message)} className="h-11" maxLength={120} placeholder="Complete 30 days of meditation" {...register("title")} />
          </FormField>

          <FormField id="goal-metric" label="What counts toward it?" error={errors.metric?.message}>
            <Controller
              control={control}
              name="metric"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="goal-metric" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_METRICS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">{GOAL_METRICS.find((m) => m.value === metric)?.description}</p>
          </FormField>

          <FormField id="goal-habit" label={metric === "COMPLETIONS" ? "Habit (optional)" : "Habit"} required={metric !== "COMPLETIONS"} error={errors.habitId?.message}>
            <Controller
              control={control}
              name="habitId"
              render={({ field }) => (
                <Select value={field.value ?? ALL_HABITS} onValueChange={(v) => field.onChange(v === ALL_HABITS ? null : v)}>
                  <SelectTrigger id="goal-habit" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metric === "COMPLETIONS" ? <SelectItem value={ALL_HABITS}>All habits</SelectItem> : <SelectItem value={ALL_HABITS}>Choose a habit…</SelectItem>}
                    {selectableHabits.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {metric === "QUANTITY" && selectableHabits.length === 0 ? <p className="text-xs text-muted-foreground">Quantity goals need a habit with a daily quantity target.</p> : null}
          </FormField>

          <FormField id="goal-target" label="Target" required error={errors.targetValue?.message}>
            <Input
              {...fieldProps("goal-target", errors.targetValue?.message)}
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              className="h-11"
              {...register("targetValue", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="goal-start" label="Start date" error={errors.startDate?.message}>
              <Input {...fieldProps("goal-start", errors.startDate?.message)} type="date" className="h-11" {...register("startDate")} />
            </FormField>
            <FormField id="goal-deadline" label="Deadline (optional)" error={errors.targetDate?.message}>
              <Input {...fieldProps("goal-deadline", errors.targetDate?.message)} type="date" className="h-11" {...register("targetDate", { setValueAs: (v) => (v ? v : null) })} />
            </FormField>
          </div>

          <FormField id="goal-description" label="Notes (optional)" error={errors.description?.message}>
            <Textarea {...fieldProps("goal-description", errors.description?.message)} rows={2} maxLength={500} {...register("description")} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {goal ? "Save goal" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
