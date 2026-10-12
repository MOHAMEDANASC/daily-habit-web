"use client";

import { Check } from "lucide-react";
import { HABIT_COLORS, HABIT_ICON_KEYS, WEEKDAY_LABELS, WEEKDAY_NAMES } from "@/shared/habits";
import { HABIT_ICONS } from "@/components/shared/habit-icon";
import { cn } from "@/lib/utils";

interface PickerProps<T> {
  value: T;
  onChange: (value: T) => void;
  label: string;
}

export function IconPicker({ value, onChange, label, color }: PickerProps<string> & { color: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {HABIT_ICON_KEYS.map((key) => {
        const Icon = HABIT_ICONS[key];
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={key.replace("-", " ")}
            onClick={() => onChange(key)}
            className={cn(
              "flex size-11 items-center justify-center rounded-xl border transition-colors hover:bg-muted",
              selected && "border-2 bg-accent",
            )}
            style={selected ? { borderColor: color, color } : undefined}
          >
            <Icon className="size-5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export function ColorPicker({ value, onChange, label }: PickerProps<string>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2.5">
      {HABIT_COLORS.map((color) => {
        const selected = value.toLowerCase() === color;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Colour ${color}`}
            onClick={() => onChange(color)}
            className="flex size-9 items-center justify-center rounded-full outline-none ring-offset-2 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
            style={{ backgroundColor: color }}
          >
            {selected ? <Check className="size-4 text-white" strokeWidth={3} aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Toggle buttons for Sunday–Saturday; `order` lets the week start on Monday. */
export function WeekdayPicker({
  value,
  onChange,
  weekStartsOn,
}: {
  value: number[];
  onChange: (days: number[]) => void;
  weekStartsOn: number;
}) {
  const order = Array.from({ length: 7 }, (_, i) => (i + weekStartsOn) % 7);
  return (
    <div role="group" aria-label="Days of the week" className="flex flex-wrap gap-2">
      {order.map((day) => {
        const selected = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            aria-pressed={selected}
            aria-label={WEEKDAY_NAMES[day]}
            onClick={() => onChange(selected ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b))}
            className={cn(
              "flex size-11 items-center justify-center rounded-full border text-sm font-medium transition-colors",
              selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {WEEKDAY_LABELS[day]}
          </button>
        );
      })}
    </div>
  );
}
