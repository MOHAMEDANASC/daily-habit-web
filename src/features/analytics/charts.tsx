"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryReportDTO, TrendPoint } from "@/shared/api-types";
import { formatDate } from "@/shared/dates";

const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 } as const;

function ChartTooltip({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{title}</p>
      {lines.map((line) => (
        <p key={line} className="text-muted-foreground">
          {line}
        </p>
      ))}
    </div>
  );
}

function DataTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: Array<Array<string | number>> }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View as table</summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-lg border">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-muted">
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col" className="px-3 py-2 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[0])} className="border-t">
                {row.map((cell, i) => (
                  <td key={i} className="px-3 py-1.5 tabular-nums">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

type Grouping = "day" | "week" | "month";

/** Completion rate over time: a line/area for days, bars for weeks and months. One series, one axis. */
export function TrendChart({ points, grouping }: { points: TrendPoint[]; grouping: Grouping }) {
  const unit = grouping === "day" ? "Day" : grouping === "week" ? "Week of" : "Month";
  const tooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendPoint }> }) => {
    const point = payload?.[0]?.payload;
    if (!active || !point) return null;
    return (
      <ChartTooltip
        title={`${unit} ${point.label}`}
        lines={point.scheduled === 0 ? ["Nothing scheduled"] : [`${point.percentage}% complete`, `${point.completed} of ${point.scheduled} habit-days`]}
      />
    );
  };

  return (
    <div>
      <div
        className="h-64 w-full"
        role="img"
        aria-label={`Completion percentage by ${grouping}. ${points.length} points; the latest is ${points.at(-1)?.percentage ?? 0}%. A table view is available below.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          {grouping === "day" ? (
            <AreaChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={28} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} tick={axisTick} unit="%" width={48} />
              <Tooltip content={tooltip as never} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
              <Area type="monotone" dataKey="percentage" stroke="var(--chart-1)" strokeWidth={2} fill="url(#trend-fill)" dot={false} activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }} />
            </AreaChart>
          ) : (
            <BarChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={16} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} tick={axisTick} unit="%" width={48} />
              <Tooltip content={tooltip as never} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
              <Bar dataKey="percentage" fill="var(--chart-1)" radius={[6, 6, 2, 2]} maxBarSize={44} minPointSize={2} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <DataTable
        caption={`Completion by ${grouping}`}
        columns={[unit, "Completed", "Scheduled", "Rate"]}
        rows={points.map((p) => [p.label, p.completed, p.scheduled, p.scheduled ? `${p.percentage}%` : "–"])}
      />
    </div>
  );
}

export function CumulativeChart({ points }: { points: Array<{ date: string; total: number }> }) {
  return (
    <div>
      <div className="h-56 w-full" role="img" aria-label={`Total completions over time, reaching ${points.at(-1)?.total ?? 0}. A table view is available below.`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={axisTick} minTickGap={32} tickFormatter={(d: string) => formatDate(d, { month: "short", day: "numeric" })} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} allowDecimals={false} width={44} />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as { date: string; total: number } | undefined;
                if (!active || !point) return null;
                return <ChartTooltip title={formatDate(point.date, { weekday: "short", month: "short", day: "numeric" })} lines={[`${point.total} completions in total`]} />;
              }}
            />
            <Area type="stepAfter" dataKey="total" stroke="var(--chart-2)" strokeWidth={2} fill="var(--chart-2)" fillOpacity={0.12} dot={false} activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption="Cumulative completions" columns={["Date", "Total completions"]} rows={points.map((p) => [formatDate(p.date, { month: "short", day: "numeric", year: "numeric" }), p.total])} />
    </div>
  );
}

/** Horizontal bars, one per category, sorted best first. */
export function CategoryChart({ categories }: { categories: CategoryReportDTO[] }) {
  return (
    <div>
      <ul className="space-y-3" aria-label="Completion rate by category">
        {categories.map((c) => (
          <li key={c.category} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{c.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {c.rate === null ? "–" : `${c.rate}%`} · {c.habits} {c.habits === 1 ? "habit" : "habits"}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${c.label}: ${c.rate ?? 0}%`}>
              <div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${c.rate ?? 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
