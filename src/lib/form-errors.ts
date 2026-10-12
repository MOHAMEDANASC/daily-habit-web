import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api-client";

/**
 * Show a server error in the form: field errors next to their inputs, everything else as a toast.
 * Returns true when at least one field error was applied.
 */
export function applyServerError<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): boolean {
  if (error instanceof ApiClientError && error.details) {
    let applied = false;
    for (const [field, message] of Object.entries(error.details)) {
      if (field === "_") continue;
      setError(field as Path<T>, { type: "server", message });
      applied = true;
    }
    if (applied) return true;
  }
  toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
  return false;
}

/** Only allow same-site relative redirects after sign-in. */
export function safeNextPath(next: string | string[] | undefined, fallback = "/dashboard"): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
