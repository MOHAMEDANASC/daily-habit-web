import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/layout/auth-card";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password", description: "Request a link to reset your Habit Tracker password." };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a link to choose a new password."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
