"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField, fieldProps } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { applyServerError } from "@/lib/form-errors";
import { registerSchema } from "@/shared/validations/auth";
import type { z } from "zod";

const formSchema = registerSchema.omit({ timeZone: true });
type Values = z.input<typeof formSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(formSchema), defaultValues: { name: "", email: "", password: "" } });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      // Pick up the browser's time zone so "today" is correct from the very first day.
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await api.post("/api/auth/register", { ...values, timeZone });
      router.replace("/habits/new?welcome=1");
      router.refresh();
    } catch (error) {
      applyServerError(error, setError);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField id="name" label="Name" error={errors.name?.message}>
        <Input {...fieldProps("name", errors.name?.message)} autoComplete="name" autoFocus className="h-11" placeholder="Ada Lovelace" {...register("name")} />
      </FormField>
      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input
          {...fieldProps("email", errors.email?.message)}
          type="email"
          inputMode="email"
          autoComplete="email"
          className="h-11"
          placeholder="you@example.com"
          {...register("email")}
        />
      </FormField>
      <FormField id="password" label="Password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number.">
        <PasswordInput {...fieldProps("password", errors.password?.message, true)} autoComplete="new-password" {...register("password")} />
      </FormField>
      <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {submitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
