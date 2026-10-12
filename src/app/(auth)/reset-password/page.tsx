import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Choose a new password for your Habit Tracker account.",
  robots: { index: false },
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;

  if (!value) {
    return (
      <AuthCard title="This link isn't valid" description="The password reset link is missing or incomplete. Request a new one to continue.">
        <Button asChild className="w-full" size="lg">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" description="Pick something you haven't used before. You'll be signed out on all devices.">
      <ResetPasswordForm token={value} />
    </AuthCard>
  );
}
