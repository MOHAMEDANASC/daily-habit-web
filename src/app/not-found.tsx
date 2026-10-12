import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground" aria-hidden="true">
        <Compass className="size-7" />
      </span>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">We couldn't find that page</h1>
        <p className="max-w-md text-muted-foreground">The link may be out of date, or the page may have moved. Let's get you back on track.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
