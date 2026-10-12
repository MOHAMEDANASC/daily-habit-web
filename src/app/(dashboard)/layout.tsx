import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/server-session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Verified by the backend against the database on every request: never trusts the cookie alone.
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
