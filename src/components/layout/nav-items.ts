import {
  BarChart3,
  Bell,
  CalendarDays,
  CircleUserRound,
  LayoutDashboard,
  ListChecks,
  Settings,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the bottom bar on small screens. */
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, primary: true },
  { href: "/tracker", label: "Today", icon: ListChecks, primary: true },
  { href: "/habits", label: "Habits", icon: Target, primary: true },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, primary: true },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/goals", label: "Goals", icon: Trophy },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export const ACCOUNT_ITEMS: NavItem[] = [
  { href: "/profile", label: "Profile", icon: CircleUserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function titleFor(pathname: string): string {
  const all = [...NAV_ITEMS, ...ACCOUNT_ITEMS];
  const match = all.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (pathname.startsWith("/habits/new")) return "New habit";
  if (/^\/habits\/[^/]+\/edit/.test(pathname)) return "Edit habit";
  if (/^\/habits\/[^/]+/.test(pathname)) return "Habit details";
  return match?.label ?? "Habit Tracker";
}

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
