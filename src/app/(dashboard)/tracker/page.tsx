import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackerSkeleton, TrackerView } from "@/features/tracker/tracker-view";

export const metadata: Metadata = { title: "Today" };

export default function TrackerPage() {
  // useSearchParams() inside TrackerView needs a Suspense boundary.
  return (
    <Suspense fallback={<TrackerSkeleton />}>
      <TrackerView />
    </Suspense>
  );
}
