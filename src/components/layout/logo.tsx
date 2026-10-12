import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)} aria-label="Habit Tracker home">
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm" aria-hidden="true">
        <Check className="size-4" strokeWidth={3} />
      </span>
      <span>Habit Tracker</span>
    </Link>
  );
}
