"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, CalendarDays, LayoutDashboard, ListChecks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; short?: string; icon: typeof LayoutDashboard };

/** Two groups: where you work, and where your records live. */
const GROUPS: Item[][] = [
  [
    { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
    { href: "/planner", label: "Planner", icon: Sparkles },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
  ],
  [
    { href: "/sessions", label: "Sessions", icon: ListChecks },
    { href: "/subjects", label: "Subjects", icon: BookOpen },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ],
];

export const NAV = GROUPS.flat();

/** Desktop (lg+): grouped sidebar list. Smaller screens: bottom tab bar. */
export function AppNav({ variant }: { variant: "sidebar" | "tabs" }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "tabs") {
    return (
      <nav aria-label="Main" className="grid grid-cols-6">
        {NAV.map(({ href, label, short, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href} href={href} aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none transition-all active:scale-95",
                active
                  ? "text-primary before:absolute before:top-0 before:h-0.5 before:w-8 before:rounded-full before:bg-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {short ?? label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Main">
      {GROUPS.map((group, i) => (
        <div key={i} className={cn("flex flex-col gap-0.5", i > 0 && "mt-3 border-t border-border/60 pt-3")}>
          {group.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href} href={href} aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.98]",
                  active
                    ? "bg-accent/80 text-accent-foreground shadow-xs before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-primary"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4 transition-colors", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
