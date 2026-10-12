"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <ErrorState
      title="This page hit a problem"
      error={new Error("Something went wrong while loading this page. You can try again.")}
      onRetry={reset}
      className="mx-auto mt-10 max-w-lg"
    />
  );
}
