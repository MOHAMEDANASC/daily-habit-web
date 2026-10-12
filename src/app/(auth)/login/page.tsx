import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/layout/auth-card";
import { LoginForm } from "@/features/auth/login-form";
import { getCurrentUser } from "@/lib/server-session";
import { safeNextPath } from "@/lib/form-errors";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to your Habit Tracker account." };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { next } = await searchParams;
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to keep your streaks going."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={safeNextPath(next)} />
    </AuthCard>
  );
}
