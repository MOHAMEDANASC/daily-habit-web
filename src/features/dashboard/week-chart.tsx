"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate } from "@/shared/dates";
import type { DaySummaryDTO } from "@/shared/api-types";

interface WeekChartProps {
  days: DaySummaryDTO[];
  today: string;
}

/** One bar per day of the current week (future days stay empty). */
export function WeekChart({ days, today }: WeekChartProps) {
  const data = days.map((day) => ({
    date: day.date,
    label: formatDate(day.date, { weekday: "short" }),
    percentage: day.date > today ? null : day.percentage,
    completed: day.completed,
    scheduled: day.scheduled,
    future: day.date > today,
  }));

  return (
    <div>
      <div className="h-48 w-full" role="img" aria-label={`Completion percentage for each day this week. ${data
        .filter((d) => !d.future)
        .map((d) => `${d.label}: ${d.scheduled === 0 ? "nothing scheduled" : `${d.percentage}%`}`)
        .join(", ")}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} unit="%" width={44} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={({ active, payload }) => {
                const item = payload?.[0]?.payload as (typeof data)[number] | undefined;
                if (!active || !item) return null;
                return (
                  <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                    <p className="font-medium">{formatDate(item.date, { weekday: "long", month: "short", day: "numeric" })}</p>
                    <p className="text-muted-foreground">
                      {item.future ? "Upcoming" : item.scheduled === 0 ? "Nothing scheduled" : `${item.completed} of ${item.scheduled} done (${item.percentage}%)`}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="percentage" radius={[6, 6, 2, 2]} maxBarSize={36} minPointSize={3}>
              {data.map((entry) => (
                <Cell key={entry.date} fill="var(--chart-1)" fillOpacity={entry.date === today ? 1 : 0.55} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Daily completion this week</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Completed</th>
            <th scope="col">Scheduled</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <th scope="row">{formatDate(d.date, { weekday: "long" })}</th>
              <td>{d.completed}</td>
              <td>{d.scheduled}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
