"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addDays, formatDate } from "@/shared/dates";
import { cn } from "@/lib/utils";

interface DateStripProps {
  selected: string;
  today: string;
  onSelect: (date: string) => void;
}

const SPAN = 14; // days shown before and after the selected day

/** Horizontally scrollable day picker, tuned for thumbs on mobile. */
export function DateStrip({ selected, today, onSelect }: DateStripProps) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const days = Array.from({ length: SPAN * 2 + 1 }, (_, i) => addDays(selected, i - SPAN));

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <section aria-label="Choose a day" className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onSelect(addDays(selected, -1))} aria-label="Previous day">
          <ChevronLeft aria-hidden="true" />
        </Button>
        <div className="relative min-w-0 flex-1">
          <label className="sr-only" htmlFor="tracker-date">
            Pick a date
          </label>
          <input
            id="tracker-date"
            type="date"
            value={selected}
            max={today}
            onChange={(event) => event.target.value && onSelect(event.target.value)}
            className="peer h-10 w-full rounded-lg border bg-card px-3 text-center text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => onSelect(addDays(selected, 1))} disabled={selected >= today} aria-label="Next day">
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button variant={selected === today ? "secondary" : "default"} onClick={() => onSelect(today)} disabled={selected === today}>
          <CalendarDays aria-hidden="true" /> Today
        </Button>
      </div>

      <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {days.map((date) => {
          const isSelected = date === selected;
          const isFuture = date > today;
          return (
            <li key={date} className="shrink-0 snap-center">
              <button
                ref={isSelected ? selectedRef : undefined}
                type="button"
                aria-current={isSelected ? "date" : undefined}
                aria-label={`${formatDate(date)}${date === today ? " (today)" : ""}`}
                disabled={isFuture}
                onClick={() => onSelect(date)}
                className={cn(
                  "flex min-h-16 w-14 flex-col items-center justify-center gap-0.5 rounded-2xl border text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  isSelected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card hover:bg-muted",
                  date === today && !isSelected && "border-primary/60",
                )}
              >
                <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">{formatDate(date, { weekday: "short" })}</span>
                <span className="text-lg font-semibold tabular-nums leading-none">{Number(date.slice(8))}</span>
                <span aria-hidden="true" className={cn("mt-0.5 size-1 rounded-full", date === today ? "bg-current" : "bg-transparent")} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
