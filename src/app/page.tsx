import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoButton } from "@/components/demo-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  ["Adaptive weekly planner", "An AI model drafts a week of study from your goals, availability, exam dates and real history. You review, edit and approve it."],
  ["Goals and progress", "Daily and weekly goals plus per-subject targets, tracked from your actual sessions."],
  ["Timer that follows you", "Start on your phone, pause on your laptop. The timer lives in the database and uses the server's clock."],
  ["Calendar heatmap", "See study intensity by day, with planned sessions shown separately from completed ones."],
  ["Honest with thin data", "With little history, the planner says so and never invents habits, scores or exam dates."],
  ["Private by design", "Row Level Security on every table. AI keys stay on the server, with per-user rate limits."],
];

const STACK = ["Next.js (App Router)", "TypeScript", "Tailwind CSS", "Supabase Postgres, Auth and RLS", "Vercel AI SDK", "Recharts"];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && !user.is_anonymous) redirect("/dashboard");

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-6 py-14 md:py-20">
      <p className="text-sm font-medium text-primary">Study Tracker</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
        Track your study time and get a weekly plan built from what you actually do.
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        A full-stack study tracker with goals, a calendar heatmap, a synced timer, and an AI planner that works from your real data.
      </p>

      <div className="mt-8 flex flex-wrap items-start gap-3">
        {user ? (
          <Button asChild><Link href="/dashboard">Continue the demo</Link></Button>
        ) : (
          <DemoButton />
        )}
        <Button asChild variant="outline"><Link href="/login">Sign in</Link></Button>
        <Button asChild variant="ghost"><Link href="/register">Create account</Link></Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        The demo gives you a private sandbox with sample data. It&rsquo;s deleted automatically after about two days, and each demo gets 2 AI plans.
      </p>

      <section aria-labelledby="features-h" className="mt-14">
        <h2 id="features-h" className="text-sm font-semibold">What it does</h2>
        <ul className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {FEATURES.map(([title, body]) => (
            <li key={title}>
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stack-h" className="mt-12">
        <h2 id="stack-h" className="text-sm font-semibold">Built with</h2>
        <p className="mt-2 text-sm text-muted-foreground">{STACK.join(" · ")}</p>
        <p className="mt-4 text-sm">
          <a href="https://github.com/Alexhzier/AI-Study-Tracker" className="font-medium underline underline-offset-4">View the source on GitHub</a>
        </p>
      </section>
    </main>
  );
}
