import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoButton } from "@/components/demo-button";
import { SamplePlanCard } from "@/components/sample-plan-card";
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
    <main className="section-stagger mx-auto min-h-dvh w-full max-w-3xl px-6 py-14 md:py-20">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-accent/60 px-3 py-1 text-xs font-semibold text-accent-foreground backdrop-blur-xs">
          <span className="size-1.5 rounded-full bg-primary" /> Study Tracker
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-[1.15]">
          Track your study time and get a weekly plan built from what you actually do.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          A full-stack study tracker with goals, a calendar heatmap, a synced timer, and an AI planner that works from your real data.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {user ? (
            <Button asChild size="lg"><Link href="/dashboard">Continue the demo</Link></Button>
          ) : (
            <DemoButton />
          )}
          <Button asChild variant="outline" size="lg"><Link href="/login">Sign in</Link></Button>
          <Button asChild variant="ghost" size="lg"><Link href="/register">Create account</Link></Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The demo gives you a private sandbox with sample data. It&rsquo;s deleted automatically after about two days, and each demo gets 2 AI plans.
        </p>
      </header>

      <div className="section-divider my-12 md:my-14" aria-hidden />

      <section aria-labelledby="features-h">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold tabular-nums text-primary">01</span>
          <h2 id="features-h" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What it does</h2>
        </div>
        <ul className="mt-4 grid gap-3.5 sm:grid-cols-2">
          {FEATURES.map(([title, body]) => (
            <li key={title} className="rounded-xl border border-border/80 bg-card/85 p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-sm">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="section-divider my-12 md:my-14" aria-hidden />

      <section aria-label="Sample plan">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="text-[11px] font-semibold tabular-nums text-primary">02</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p>
        </div>
        <SamplePlanCard />
      </section>

      <div className="section-divider my-12 md:my-14" aria-hidden />

      <section aria-labelledby="stack-h">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold tabular-nums text-primary">03</span>
          <h2 id="stack-h" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Built with</h2>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {STACK.map((item) => (
            <span key={item} className="inline-flex items-center rounded-lg border border-border/70 bg-card/80 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-2xs transition-colors hover:border-primary/30 hover:text-foreground">
              {item}
            </span>
          ))}
        </div>
        <p className="mt-5 text-sm">
          <a href="https://github.com/Alexhzier/AI-Study-Tracker" className="font-semibold text-primary underline underline-offset-4 transition-colors hover:text-primary/80">View the source on GitHub</a>
        </p>
      </section>
    </main>
  );
}
