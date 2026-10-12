import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/layout/auth-card";
import { RegisterForm } from "@/features/auth/register-form";
import { getCurrentUser } from "@/lib/server-session";

export const metadata: Metadata = { title: "Create your account", description: "Start building habits that last with a free Habit Tracker account." };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <AuthCard
      title="Create your account"
      description="Track habits, protect your streaks and see your progress."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
