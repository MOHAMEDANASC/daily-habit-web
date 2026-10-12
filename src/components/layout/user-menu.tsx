"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CircleUserRound, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/components/layout/user-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api-client";

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return async function signOut() {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out.");
      return;
    }
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  };
}

export function UserMenu() {
  const user = useUser();
  const signOut = useSignOut();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Account menu for ${user.name}`}
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-accent text-sm font-medium text-accent-foreground">{initialsOf(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5">
          <div className="truncate text-sm font-medium">{user.name}</div>
          <div className="truncate text-xs font-normal text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <CircleUserRound aria-hidden="true" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden="true" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
