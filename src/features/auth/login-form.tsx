"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField, fieldProps } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { applyServerError } from "@/lib/form-errors";
import { loginSchema } from "@/shared/validations/auth";
import type { z } from "zod";

type Values = z.input<typeof loginSchema>;

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      await api.post("/api/auth/login", values);
      router.replace(next);
      router.refresh();
    } catch (error) {
      applyServerError(error, setError);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input
          {...fieldProps("email", errors.email?.message)}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          className="h-11"
          placeholder="you@example.com"
          {...register("email")}
        />
      </FormField>
      <FormField id="password" label="Password" error={errors.password?.message}>
        <PasswordInput {...fieldProps("password", errors.password?.message)} autoComplete="current-password" {...register("password")} />
      </FormField>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
