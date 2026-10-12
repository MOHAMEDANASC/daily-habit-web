"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField, fieldProps } from "@/components/forms/form-field";
import { useUser } from "@/components/layout/user-context";
import { initialsOf } from "@/components/layout/user-menu";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "@/features/settings/use-update-profile";
import { formatDate } from "@/shared/dates";
import { applyServerError } from "@/lib/form-errors";

const schema = z.object({ name: z.string().trim().min(1, "Enter your name.").max(80, "Use at most 80 characters.") });
type Values = z.infer<typeof schema>;

export function ProfileView() {
  const user = useUser();
  const update = useUpdateProfile("Profile updated");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: user.name } });

  async function onSubmit(values: Values) {
    try {
      await update.mutateAsync(values);
    } catch (error) {
      applyServerError(error, setError);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profile" description="How you appear in Habit Tracker." />
      <Card className="card-soft gap-6 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-accent text-xl font-semibold text-accent-foreground">{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">Member since {formatDate(user.createdAt.slice(0, 10), { month: "long", year: "numeric" })}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField id="name" label="Name" error={errors.name?.message}>
            <Input {...fieldProps("name", errors.name?.message)} className="h-11" autoComplete="name" maxLength={80} {...register("name")} />
          </FormField>
          <FormField id="email" label="Email" hint="Your email is your sign-in. Contact support to change it.">
            <Input id="email" value={user.email} readOnly disabled className="h-11" aria-describedby="email-hint" />
          </FormField>
          <Button type="submit" disabled={!isDirty || update.isPending}>
            {update.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Save profile
          </Button>
        </form>
      </Card>
    </div>
  );
}
