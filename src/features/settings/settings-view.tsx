"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Monitor, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField, fieldProps } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { useUser } from "@/components/layout/user-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TIMEZONE_FALLBACKS } from "@/shared/habits";
import { useUpdateProfile } from "@/features/settings/use-update-profile";
import { api } from "@/lib/api-client";
import { applyServerError } from "@/lib/form-errors";
import { passwordSchema } from "@/shared/validations/common";
import { cn } from "@/lib/utils";
import type { ThemePreference } from "@/shared/api-types";

const THEMES: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "LIGHT", label: "Light", icon: Sun },
  { value: "DARK", label: "Dark", icon: Moon },
  { value: "SYSTEM", label: "System", icon: Monitor },
];

const WEEK_STARTS = [
  { value: 1, label: "Monday" },
  { value: 0, label: "Sunday" },
  { value: 6, label: "Saturday" },
];

function Section({ id, title, description, children }: { id?: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card id={id} className="card-soft scroll-mt-24 rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function ToggleRow({ id, label, description, checked, onChange, disabled }: { id: string; label: string; description: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p id={`${id}-desc`} className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch id={id} aria-describedby={`${id}-desc`} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function RegionalSettings() {
  const user = useUser();
  const { setTheme } = useTheme();
  const update = useUpdateProfile("Settings saved");
  const zones = useMemo(() => {
    const supported = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [...TIMEZONE_FALLBACKS];
    return [...new Set(["UTC", user.timeZone, ...supported])].sort();
  }, [user.timeZone]);

  return (
    <Section title="Appearance & time" description="Your time zone decides when each day starts and ends for habits, streaks and reminders.">
      <div className="space-y-2">
        <Label>Theme</Label>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={user.preferredTheme === value}
              onClick={() => {
                setTheme(value.toLowerCase());
                update.mutate({ preferredTheme: value });
              }}
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors",
                user.preferredTheme === value ? "border-primary bg-accent text-accent-foreground" : "bg-card hover:bg-muted",
              )}
            >
              <Icon className="size-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>

      <FormField id="timeZone" label="Time zone" hint="Changing it re-evaluates which day each completion belongs to from now on; past entries keep their dates.">
        <select
          id="timeZone"
          aria-describedby="timeZone-hint"
          value={user.timeZone}
          onChange={(e) => update.mutate({ timeZone: e.target.value })}
          className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="weekStart" label="Week starts on">
        <select
          id="weekStart"
          value={user.weekStartsOn}
          onChange={(e) => update.mutate({ weekStartsOn: Number(e.target.value) })}
          className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-60"
        >
          {WEEK_STARTS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </FormField>
    </Section>
  );
}

function NotificationSettings() {
  const user = useUser();
  const update = useUpdateProfile("Notification settings saved");
  const stored = useSyncExternalStore(
    () => () => undefined,
    (): NotificationPermission | "unsupported" => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
    (): NotificationPermission | "unsupported" => "default",
  );
  const [requested, setPermission] = useState<NotificationPermission | null>(null);
  const permission = requested ?? stored;

  async function toggleBrowser(on: boolean) {
    if (!on) {
      update.mutate({ browserNotifications: false });
      return;
    }
    if (typeof Notification === "undefined") {
      toast.error("This browser doesn't support notifications.");
      return;
    }
    // The permission prompt is only shown now, in direct response to the user turning this on.
    const result = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    setPermission(result);
    if (result === "granted") update.mutate({ browserNotifications: true });
    else toast.error("Notifications are blocked for this site. Allow them in your browser's site settings, then try again.");
  }

  return (
    <Section id="notifications" title="Notifications" description="Choose what Habit Tracker tells you about.">
      <ToggleRow id="reminders" label="Habit reminders" description="Create an in-app notification at each habit's reminder time if it isn't done yet." checked={user.remindersEnabled} onChange={(v) => update.mutate({ remindersEnabled: v })} />
      <ToggleRow id="milestones" label="Milestones & streaks" description="Celebrate reached goals and streak milestones." checked={user.milestoneAlerts} onChange={(v) => update.mutate({ milestoneAlerts: v })} />
      <ToggleRow
        id="browser"
        label="Browser notifications"
        description={
          permission === "unsupported"
            ? "Not supported in this browser."
            : permission === "denied"
              ? "Blocked in your browser's site settings."
              : "Also show new notifications as system alerts."
        }
        checked={user.browserNotifications && permission === "granted"}
        onChange={(v) => void toggleBrowser(v)}
        disabled={permission === "unsupported"}
      />
      <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
        How delivery works: reminders are created by the server's scheduled job at the right time in your time zone when your administrator has enabled it, and otherwise the next time you open the app. Browser notifications only appear while Habit Tracker is open in a browser tab; closing it stops them.
      </p>
    </Section>
  );
}

const passwordForm = z
  .object({ currentPassword: z.string().min(1, "Enter your current password."), newPassword: passwordSchema, confirm: z.string() })
  .refine((v) => v.newPassword === v.confirm, { path: ["confirm"], message: "The passwords don't match." });
type PasswordValues = z.input<typeof passwordForm>;

function PasswordSettings() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordForm), defaultValues: { currentPassword: "", newPassword: "", confirm: "" } });

  async function onSubmit({ currentPassword, newPassword }: PasswordValues) {
    try {
      await api.patch("/api/me/password", { currentPassword, newPassword });
      toast.success("Password updated. Other devices were signed out.");
      reset();
    } catch (error) {
      applyServerError(error, setError);
    }
  }

  return (
    <Section title="Password" description="Changing your password signs you out everywhere else.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-4">
        <FormField id="currentPassword" label="Current password" error={errors.currentPassword?.message}>
          <PasswordInput {...fieldProps("currentPassword", errors.currentPassword?.message)} autoComplete="current-password" {...register("currentPassword")} />
        </FormField>
        <FormField id="newPassword" label="New password" error={errors.newPassword?.message} hint="At least 8 characters, with a letter and a number.">
          <PasswordInput {...fieldProps("newPassword", errors.newPassword?.message, true)} autoComplete="new-password" {...register("newPassword")} />
        </FormField>
        <FormField id="confirm" label="Confirm new password" error={errors.confirm?.message}>
          <PasswordInput {...fieldProps("confirm", errors.confirm?.message)} autoComplete="new-password" {...register("confirm")} />
        </FormField>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Update password
        </Button>
      </form>
    </Section>
  );
}

function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    setError(undefined);
    try {
      await api.delete("/api/me", { password });
      toast.success("Your account has been deleted.");
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the account.");
      setPending(false);
    }
  }

  return (
    <Card className="card-soft rounded-2xl border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Delete account</CardTitle>
        <CardDescription>Permanently removes your account, habits, completion history, goals and notifications. This can't be undone.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      </CardContent>
      <AlertDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setPassword(""); setError(undefined); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>Enter your password to confirm. All of your data will be erased immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <FormField id="delete-password" label="Password" error={error}>
            <PasswordInput {...fieldProps("delete-password", error)} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </FormField>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={pending || password.length === 0} onClick={() => void remove()}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Delete forever
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export function SettingsView() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Preferences for your account." />
      <RegionalSettings />
      <NotificationSettings />
      <PasswordSettings />
      <DangerZone />
    </div>
  );
}
