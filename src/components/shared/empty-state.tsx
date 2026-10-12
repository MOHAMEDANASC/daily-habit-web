import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground" aria-hidden="true">
        <Icon className="size-6" />
      </span>
      <div className="max-w-sm space-y-1">
        <h3 className="font-semibold">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
