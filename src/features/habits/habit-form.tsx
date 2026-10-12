"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { FormField, fieldProps } from "@/components/forms/form-field";
import { ColorPicker, IconPicker, WeekdayPicker } from "@/components/forms/pickers";
import { useUser } from "@/components/layout/user-context";
import { HabitIcon } from "@/components/shared/habit-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, SCHEDULE_TYPES } from "@/shared/habits";
import { useCreateHabit, useUpdateHabit } from "@/features/habits/hooks";
import { todayInTimeZone } from "@/shared/dates";
import { applyServerError } from "@/lib/form-errors";
import { habitInputSchema, type HabitInput } from "@/shared/validations/habit";
import { cn } from "@/lib/utils";
import type { HabitDTO } from "@/shared/api-types";

type Values = z.input<typeof habitInputSchema>;

const UNIT_SUGGESTIONS = ["minutes", "pages", "glasses", "reps", "steps", "km", "hours"];

function defaultsFor(habit: HabitDTO | undefined, today: string): Values {
  if (habit) {
    return {
      name: habit.name,
      description: habit.description ?? "",
      category: habit.category,
      customCategory: habit.customCategory ?? "",
      icon: habit.icon as Values["icon"],
      color: habit.color,
      scheduleType: habit.scheduleType,
      scheduledDays: habit.scheduledDays,
      weeklyTarget: habit.weeklyTarget,
      targetValue: habit.targetValue,
      targetUnit: habit.targetUnit ?? "",
      reminderTime: habit.reminderTime,
      startDate: habit.startDate,
    };
  }
  return {
    name: "",
    description: "",
    category: "PERSONAL_DEVELOPMENT",
    customCategory: "",
    icon: "target",
    color: "#6366f1",
    scheduleType: "DAILY",
    scheduledDays: [],
    weeklyTarget: 3,
    targetValue: null,
    targetUnit: "",
    reminderTime: null,
    startDate: today,
  };
}

export function HabitForm({ habit }: { habit?: HabitDTO }) {
  const router = useRouter();
  const user = useUser();
  const today = todayInTimeZone(user.timeZone);
  const create = useCreateHabit();
  const update = useUpdateHabit(habit?.id ?? "");
  const pending = create.isPending || update.isPending;

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<Values, unknown, HabitInput>({
    resolver: zodResolver(habitInputSchema),
    defaultValues: defaultsFor(habit, today),
  });

  const [name, icon, color, category, scheduleType, scheduledDays, targetValue, reminderTime] = useWatch({
    control,
    name: ["name", "icon", "color", "category", "scheduleType", "scheduledDays", "targetValue", "reminderTime"],
  });
  const measurable = targetValue !== null && targetValue !== undefined;
  const reminderOn = reminderTime !== null && reminderTime !== undefined;

  async function onSubmit(values: HabitInput) {
    try {
      const saved = habit ? await update.mutateAsync(values) : await create.mutateAsync(values);
      router.push(`/habits/${saved.habit.id}`);
    } catch (error) {
      applyServerError(error, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <Card className="card-soft gap-5 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <HabitIcon icon={icon} color={color} size="lg" className="mt-6" />
          <FormField id="name" label="Name" required error={errors.name?.message} className="flex-1">
            <Input {...fieldProps("name", errors.name?.message)} className="h-11" placeholder="e.g. Read for 20 minutes" maxLength={100} autoFocus={!habit} {...register("name")} />
          </FormField>
        </div>
        <FormField id="description" label="Description (optional)" error={errors.description?.message}>
          <Textarea {...fieldProps("description", errors.description?.message)} rows={2} maxLength={500} placeholder="Why does this habit matter to you?" {...register("description")} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="category" label="Category" error={errors.category?.message}>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          {category === "CUSTOM" ? (
            <FormField id="customCategory" label="Custom category name" required error={errors.customCategory?.message}>
              <Input {...fieldProps("customCategory", errors.customCategory?.message)} className="h-11" maxLength={40} placeholder="e.g. Family" {...register("customCategory")} />
            </FormField>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Icon</Label>
          <Controller control={control} name="icon" render={({ field }) => <IconPicker label="Icon" value={field.value} onChange={field.onChange} color={color} />} />
        </div>
        <div className="space-y-2">
          <Label>Colour</Label>
          <Controller control={control} name="color" render={({ field }) => <ColorPicker label="Colour" value={field.value} onChange={field.onChange} />} />
        </div>
      </Card>

      <Card className="card-soft gap-5 rounded-2xl p-5">
        <div className="space-y-3">
          <h2 className="font-semibold">Schedule</h2>
          <div role="radiogroup" aria-label="How often" className="grid gap-2 sm:grid-cols-3">
            {SCHEDULE_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                role="radio"
                aria-checked={scheduleType === type.value}
                onClick={() => {
                  setValue("scheduleType", type.value, { shouldValidate: true });
                  if (type.value === "SELECTED_DAYS" && scheduledDays.length === 0) setValue("scheduledDays", [1, 2, 3, 4, 5]);
                }}
                className={cn(
                  "min-h-12 rounded-xl border px-4 text-sm font-medium transition-colors",
                  scheduleType === type.value ? "border-primary bg-accent text-accent-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          {scheduleType === "SELECTED_DAYS" ? (
            <FormField id="scheduledDays" label="On these days" error={errors.scheduledDays?.message}>
              <WeekdayPicker value={scheduledDays} weekStartsOn={user.weekStartsOn} onChange={(days) => setValue("scheduledDays", days, { shouldValidate: true })} />
              <p className="text-xs text-muted-foreground">Streaks skip the days you didn't schedule, so a weekday habit doesn't break over a weekend.</p>
            </FormField>
          ) : null}
          {scheduleType === "WEEKLY" ? (
            <FormField id="weeklyTarget" label="Times per week" error={errors.weeklyTarget?.message} hint="Do it on any days. The streak counts weeks that reach the target.">
              <Controller
                control={control}
                name="weeklyTarget"
                render={({ field }) => (
                  <Select value={String(field.value ?? 3)} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger id="weeklyTarget" className="h-11 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}× per week
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="startDate" label="Start date" error={errors.startDate?.message}>
            <Input {...fieldProps("startDate", errors.startDate?.message)} type="date" className="h-11" {...register("startDate")} />
          </FormField>
        </div>
      </Card>

      <Card className="card-soft gap-4 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="measurable-switch" className="text-base font-semibold">
              Track a quantity
            </Label>
            <p className="text-sm text-muted-foreground">For habits with a daily amount, like 20 minutes or 8 glasses. A day counts once you reach it.</p>
          </div>
          <Switch
            id="measurable-switch"
            checked={measurable}
            onCheckedChange={(on) => {
              setValue("targetValue", on ? 1 : null, { shouldValidate: true });
              if (!on) setValue("targetUnit", "");
            }}
          />
        </div>
        {measurable ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="targetValue" label="Daily target" error={errors.targetValue?.message}>
              <Input
                {...fieldProps("targetValue", errors.targetValue?.message)}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                className="h-11"
                {...register("targetValue", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
              />
            </FormField>
            <FormField id="targetUnit" label="Unit" error={errors.targetUnit?.message}>
              <Input {...fieldProps("targetUnit", errors.targetUnit?.message)} className="h-11" list="unit-suggestions" maxLength={30} placeholder="minutes" {...register("targetUnit")} />
              <datalist id="unit-suggestions">
                {UNIT_SUGGESTIONS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </FormField>
          </div>
        ) : null}
      </Card>

      <Card className="card-soft gap-4 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="reminder-switch" className="text-base font-semibold">
              Reminder
            </Label>
            <p className="text-sm text-muted-foreground">
              Adds an in-app notification at this time (in your time zone) if the habit isn't done yet.
            </p>
          </div>
          <Switch id="reminder-switch" checked={reminderOn} onCheckedChange={(on) => setValue("reminderTime", on ? "09:00" : null, { shouldValidate: true })} />
        </div>
        {reminderOn ? (
          <FormField id="reminderTime" label="Remind me at" error={errors.reminderTime?.message}>
            <Input {...fieldProps("reminderTime", errors.reminderTime?.message)} type="time" className="h-11 w-40" {...register("reminderTime", { setValueAs: (v) => (v ? v : null) })} />
          </FormField>
        ) : null}
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={pending || name.trim().length === 0}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {habit ? "Save changes" : "Create habit"}
        </Button>
      </div>
    </form>
  );
}
