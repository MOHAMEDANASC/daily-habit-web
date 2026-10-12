"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api-client";
import type { ThemePreference } from "@/shared/api-types";

const TO_SERVER: Record<string, ThemePreference> = { system: "SYSTEM", light: "LIGHT", dark: "DARK" };

/** `persist` saves the choice on the signed-in account; leave it off on public pages. */
export function ThemeToggle({ persist = false }: { persist?: boolean }) {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  // false during server rendering and hydration, true afterwards (avoids a theme-icon mismatch).
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  function choose(value: string) {
    setTheme(value);
    if (!persist) return;
    // Remember the choice on the account so it follows the user across devices (best effort).
    void api
      .patch("/api/me", { preferredTheme: TO_SERVER[value] })
      .then(() => router.refresh())
      .catch(() => undefined);
  }

  const Icon = !mounted ? Sun : resolvedTheme === "dark" ? Moon : Sun;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          <Icon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup value={mounted ? (theme ?? "system") : "system"} onValueChange={choose}>
          <DropdownMenuRadioItem value="light">
            <Sun aria-hidden="true" /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon aria-hidden="true" /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor aria-hidden="true" /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Applies the account's saved theme once per page load. */
export function ThemeSync({ preference }: { preference: ThemePreference }) {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme(preference.toLowerCase());
  }, [preference, setTheme]);
  return null;
}
