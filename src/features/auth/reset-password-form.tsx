"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField, fieldProps } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { applyServerError } from "@/lib/form-errors";
import { passwordSchema } from "@/shared/validations/common";

const formSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords don't match." });

type Values = z.input<typeof formSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(formSchema), defaultValues: { password: "", confirm: "" } });

  async function onSubmit({ password }: Values) {
    setSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      toast.success("Password updated. Sign in with your new password.");
      router.replace("/login");
    } catch (error) {
      applyServerError(error, setError);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField id="password" label="New password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number.">
        <PasswordInput {...fieldProps("password", errors.password?.message, true)} autoComplete="new-password" autoFocus {...register("password")} />
      </FormField>
      <FormField id="confirm" label="Confirm new password" error={errors.confirm?.message}>
        <PasswordInput {...fieldProps("confirm", errors.confirm?.message)} autoComplete="new-password" {...register("confirm")} />
      </FormField>
      <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {submitting ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
