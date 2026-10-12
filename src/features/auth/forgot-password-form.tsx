"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField, fieldProps } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { applyServerError } from "@/lib/form-errors";
import { forgotPasswordSchema } from "@/shared/validations/auth";
import type { z } from "zod";

type Values = z.input<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  async function onSubmit(values: Values) {
    try {
      await api.post("/api/auth/forgot-password", values);
      setSentTo(values.email);
    } catch (error) {
      applyServerError(error, setError);
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="space-y-3 rounded-xl border bg-accent/50 p-4 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-5 text-success" aria-hidden="true" /> Check your inbox
        </div>
        <p className="text-muted-foreground">
          If an account exists for <strong className="text-foreground">{sentTo}</strong>, we've sent a link to reset your password.
          It stays valid for 60 minutes.
        </p>
      </div>
    );
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
      <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
