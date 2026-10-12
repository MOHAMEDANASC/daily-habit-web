import { PartyPopper } from "lucide-react";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Card } from "@/components/ui/card";
import type { DaySummaryDTO } from "@/shared/api-types";

export function DaySummary({ summary, label }: { summary: DaySummaryDTO; label: string }) {
  const remaining = summary.scheduled - summary.completed;
  return (
    <Card className="card-soft flex-row items-center gap-5 rounded-2xl p-4 sm:p-5">
      <ProgressRing value={summary.percentage} size={88} strokeWidth={9} label={`${label} completion`}>
        <span className="text-xl font-semibold tabular-nums">{summary.percentage}%</span>
      </ProgressRing>
      <div className="min-w-0 space-y-1">
        <p className="text-lg font-semibold">
          {summary.scheduled === 0
            ? "Nothing scheduled"
            : summary.status === "complete"
              ? "All done"
              : `${summary.completed} of ${summary.scheduled} done`}
        </p>
        <p className="text-sm text-muted-foreground">
          {summary.scheduled === 0
            ? "Enjoy the free day, or add a habit."
            : summary.status === "complete"
              ? "Every scheduled habit is complete."
              : `${remaining} left to do.`}
        </p>
        {summary.status === "complete" ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            <PartyPopper className="size-4" aria-hidden="true" /> Perfect day
          </p>
        ) : null}
      </div>
    </Card>
  );
}
