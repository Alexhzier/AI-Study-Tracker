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
    <div className="min-h-dvh lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r px-3 py-4 lg:flex">
        <Brand />
        <div className="mt-6"><AppNav variant="sidebar" /></div>
        <div className="mt-auto border-t pt-3">
          <p className="truncate px-2.5 pb-2 text-xs text-muted-foreground">{user.email ?? "Demo visitor"}</p>
          <div className="flex items-center justify-between">
            <form action={logout}>
              <button className="inline-flex h-8 items-center gap-2 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <header className="flex items-center justify-between border-b px-3 py-2 lg:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={logout}>
              <button aria-label="Sign out" className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
                <LogOut className="size-4" aria-hidden />
              </button>
            </form>
          </div>
        </header>

        {user.is_anonymous && (
          <div role="status" className="border-b bg-accent px-4 py-2 text-center text-xs text-accent-foreground">
            You&rsquo;re in demo mode with sample data, deleted automatically after about two days.{" "}
            <Link href="/register" className="font-medium underline underline-offset-4">Create a free account</Link>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        <AppNav variant="tabs" />
      </div>
    </div>
  );
}
