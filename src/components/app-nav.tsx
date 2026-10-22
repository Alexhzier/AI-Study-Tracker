"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, CalendarDays, LayoutDashboard, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/sessions", label: "Sessions", icon: ListChecks },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

/** Desktop: vertical sidebar list. Mobile: bottom tab bar. */
export function AppNav({ variant }: { variant: "sidebar" | "tabs" }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={variant === "sidebar" ? "flex flex-col gap-0.5" : "grid grid-cols-5"}>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href} href={href} aria-current={active ? "page" : undefined}
            className={cn(
              "transition-colors",
              variant === "sidebar"
                ? "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm"
                : "flex flex-col items-center gap-1 py-2.5 text-[11px]",
              active
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              variant === "tabs" && "rounded-none",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
