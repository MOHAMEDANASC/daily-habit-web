import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarView } from "@/features/calendar/calendar-view";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
      <CalendarView />
    </Suspense>
  );
}
