import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-session";

// No marketing page: signed-in users land on the dashboard, everyone else on sign in.
export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
