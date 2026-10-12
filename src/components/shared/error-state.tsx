"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = "We couldn't load this", error, onRetry, className }: ErrorStateProps) {
  const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center", className)}
    >
      <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RotateCw aria-hidden="true" /> Try again
        </Button>
      ) : null}
    </div>
  );
}
