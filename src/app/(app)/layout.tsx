import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { AppNav } from "@/components/app-nav";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border/70 bg-card/50 px-3.5 py-4 backdrop-blur-xs lg:flex">
        <Brand />
        <div className="mt-6"><AppNav variant="sidebar" /></div>
        <div className="mt-auto border-t border-border/60 pt-3">
          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" aria-hidden />
            <p className="truncate font-medium">{user.email ?? "Demo visitor"}</p>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <form action={logout}>
              <button className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary/70 hover:text-foreground active:scale-95">
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0">
        <header className="flex items-center justify-between border-b border-border/70 bg-card/85 px-4 py-2.5 backdrop-blur-md lg:hidden">
          <Brand />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <form action={logout}>
              <button aria-label="Sign out" className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95">
                <LogOut className="size-4" aria-hidden />
              </button>
            </form>
          </div>
        </header>

        {user.is_anonymous && (
          <div role="status" className="border-b border-accent-foreground/10 bg-accent/60 px-4 py-2 text-center text-xs text-accent-foreground backdrop-blur-xs">
            You&rsquo;re in demo mode with sample data, deleted automatically after about two days.{" "}
            <Link href="/register" className="font-semibold underline underline-offset-4">Create a free account</Link>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-card/85 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
        <AppNav variant="tabs" />
      </div>
    </div>
  );
}
