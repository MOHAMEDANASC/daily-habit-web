import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("card-soft gap-1 rounded-2xl p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
      </div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}
