"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { ACCOUNT_ITEMS, NAV_ITEMS, isActive, titleFor, type NavItem } from "@/components/layout/nav-items";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeSync, ThemeToggle } from "@/components/layout/theme-toggle";
import { UserProvider } from "@/components/layout/user-context";
import { UserMenu, useSignOut } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatDate, todayInTimeZone } from "@/shared/dates";
import { cn } from "@/lib/utils";
import type { UserDTO } from "@/shared/api-types";
import { LogOut } from "lucide-react";

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon className="size-[18px]" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function SideNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}
      <div className="my-2 h-px bg-border" role="separator" />
      {ACCOUNT_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  const primary = NAV_ITEMS.filter((item) => item.primary);
  const moreActive = !primary.some((item) => isActive(pathname, item.href));

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {primary.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  moreActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Menu className="size-5" aria-hidden="true" />
                More
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl pb-[env(safe-area-inset-bottom)]">
              <SheetHeader>
                <SheetTitle>More</SheetTitle>
                <SheetDescription className="sr-only">Additional pages and account actions</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 pb-4">
                {[...NAV_ITEMS.filter((i) => !i.primary), ...ACCOUNT_ITEMS].map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} onNavigate={() => setOpen(false)} />
                ))}
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  <LogOut className="size-[18px]" aria-hidden="true" /> Sign out
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}

export function AppShell({ user, children }: { user: UserDTO; children: ReactNode }) {
  const pathname = usePathname();
  const today = formatDate(todayInTimeZone(user.timeZone), { weekday: "long", month: "long", day: "numeric" });

  return (
    <UserProvider user={user}>
      <ThemeSync preference={user.preferredTheme} />
      <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
        <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-sidebar p-4 lg:flex">
          <Logo href="/dashboard" className="px-2 pt-1 text-lg" />
          <SideNav pathname={pathname} />
          <p className="mt-auto px-3 text-xs text-muted-foreground">Times shown in {user.timeZone.replace("_", " ")}</p>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
            <Logo href="/dashboard" className="lg:hidden" />
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-semibold">{titleFor(pathname)}</p>
              <p className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                {today}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button asChild variant="default" size="sm" className="mr-2 hidden sm:inline-flex">
                <Link href="/habits/new">New habit</Link>
              </Button>
              <NotificationBell />
              <ThemeToggle persist />
              <UserMenu />
            </div>
          </header>

          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 outline-none sm:px-6 lg:pb-10">
            {children}
          </main>
        </div>
      </div>
      <BottomNav pathname={pathname} />
    </UserProvider>
  );
}
