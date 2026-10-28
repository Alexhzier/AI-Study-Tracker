import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { Duration } from "@/components/duration";
import { GoalsCard } from "@/components/goals-card";
import { GoalsDialog } from "@/components/goals-dialog";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Panel, PanelHeader } from "@/components/panel";
import { ProgressBar } from "@/components/progress-bar";
import { SessionDialog } from "@/components/session-dialog";
import { SessionRow } from "@/components/session-row";
import { StudyTimer } from "@/components/study-timer";
import { Button } from "@/components/ui/button";
import { getPlannedItems, getPlannerSettings } from "@/lib/data/planner";
import { getSessionLite, getSubjects, listSessions } from "@/lib/data/queries";
import { computeGoalProgress } from "@/lib/goals";
import { summarize, totalsBySubject } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { formatMinutes, monthRange, todayISO, weekRange } from "@/lib/time";

export const metadata: Metadata = { title: "Dashboard" };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = todayISO();

  const [subjects, rows, recent, planner, plannedToday] = await Promise.all([
    getSubjects(),
    getSessionLite(),
    listSessions({ limit: 8 }),
    getPlannerSettings(),
    getPlannedItems(today, today),
  ]);

  const s = summarize(rows, today, weekRange(), monthRange());
  const goals = { daily: planner.dailyGoalMinutes, weekly: planner.weeklyGoalMinutes, targets: planner.weeklyTargets };
  const progress = computeGoalProgress(rows, goals, today, weekRange());
  const active = subjects.filter((x) => !x.is_archived);

  const totals = totalsBySubject(rows);
  const breakdown = subjects
    .map((sub) => ({ sub, ...(totals.get(sub.id) ?? { minutes: 0, count: 0 }) }))
    .filter((r) => r.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const todayRows = rows.filter((r) => r.session_date === today);
  const todaySubjects = new Set(todayRows.map((r) => r.subject_id)).size;
  const daily = goals.daily;

  const secondary = [
    { label: "This week", minutes: s.weekMin, note: goals.weekly ? `of ${formatMinutes(goals.weekly)} goal` : undefined },
    { label: "This month", minutes: s.monthMin },
    { label: "All time", minutes: s.allMin },
  ];

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow={format(parseISO(today), "EEEE, MMMM d")}
        title="Dashboard"
        action={
          <SessionDialog subjects={subjects}>
            <Button variant="outline"><Plus className="size-4" aria-hidden /> Log session</Button>
          </SessionDialog>
        }
      />

      {/* Today: the centre of gravity. Time studied, goal progress, and the timer. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel aria-labelledby="today-h" className="bg-gradient-to-br from-accent/35 via-card to-card p-5 lg:p-6">
          <h2 id="today-h" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Studied today</h2>
          <div className="mt-2"><Duration minutes={s.todayMin} size="display" /></div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {todayRows.length === 0
              ? "No sessions yet today."
              : `${plural(todayRows.length, "session")} across ${plural(todaySubjects, "subject")}`}
          </p>

          <div className="mt-6">
            {daily ? (
              <>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-foreground">Daily goal</span>
                  <span className="tabular-nums text-muted-foreground">{formatMinutes(daily)}</span>
                </div>
                <ProgressBar size="lg" value={s.todayMin} max={daily} label="Daily goal progress" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {s.todayMin >= daily ? "Daily goal reached." : `${formatMinutes(daily - s.todayMin)} to go.`}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No daily goal yet.{" "}
                <GoalsDialog
                  daily={goals.daily}
                  weekly={goals.weekly}
                  subjects={active.map((x) => ({ id: x.id, name: x.name, color: x.color, target: goals.targets[x.id] ?? null }))}
                >
                  <Button variant="link" className="h-auto p-0">Set a daily goal</Button>
                </GoalsDialog>
              </p>
            )}
          </div>

          {plannedToday.length > 0 && (
            <div className="mt-5 border-t border-border/60 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Planned for today</h3>
              <ul className="mt-2.5 space-y-1.5">
                {plannedToday.map((p) => {
                  const sub = subjects.find((x) => x.id === p.subject_id);
                  return (
                    <li key={p.id} className="flex items-baseline justify-between gap-3 rounded-lg px-2 py-1 -mx-2 text-sm transition-colors hover:bg-secondary/40">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: sub?.color ?? "#999" }} aria-hidden />
                        <span className="truncate font-medium">{sub?.name ?? "Subject"}{p.topic ? ` · ${p.topic}` : ""}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{formatMinutes(p.duration_minutes)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Panel>

        <StudyTimer subjects={subjects} userId={user?.id ?? ""} />
      </div>

      {/* Secondary figures: one quiet strip instead of a row of equal cards. */}
      <Panel className="mt-5 overflow-hidden" aria-label="Study totals">
        <dl className="grid grid-cols-2 sm:grid-cols-4 [&>*:nth-child(even)]:border-l [&>*:nth-child(even)]:border-border/60 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-border/60 sm:[&>*:nth-child(n+2)]:border-l sm:[&>*:nth-child(n+2)]:border-border/60 sm:[&>*:nth-child(n+3)]:border-t-0">
          {secondary.map((st) => (
            <div key={st.label} className="px-4 py-3.5 sm:px-5 sm:py-4 transition-colors hover:bg-secondary/30">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{st.label}</dt>
              <dd className="mt-1"><Duration minutes={st.minutes} size="lg" /></dd>
              {st.note && <p className="mt-0.5 text-xs text-muted-foreground">{st.note}</p>}
            </div>
          ))}
          <div className="px-4 py-3.5 sm:px-5 sm:py-4 transition-colors hover:bg-secondary/30">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Study streak</dt>
            <dd className="mt-1 text-xl font-bold tracking-tight tabular-nums">
              {s.streak} <span className="text-sm font-medium text-muted-foreground">{s.streak === 1 ? "day" : "days"}</span>
            </dd>
          </div>
        </dl>
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel aria-labelledby="recent-h" className="overflow-hidden">
          <PanelHeader
            id="recent-h" title="Recent sessions"
            action={<Link href="/sessions" className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">View all</Link>}
          />
          {recent.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {subjects.length === 0 ? (
                <>No sessions yet. <Link href="/subjects" className="font-medium text-foreground underline underline-offset-4">Add a subject</Link> to get started.</>
              ) : "No sessions yet. Start the timer or log one to see it here."}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {recent.map((r) => <SessionRow key={r.id} session={r} subjects={subjects} showDate />)}
            </ul>
          )}
        </Panel>

        <div className="space-y-5">
          <GoalsCard goals={goals} progress={progress} subjects={subjects} />

          <Panel aria-labelledby="subj-h">
            <PanelHeader id="subj-h" title="Time by subject" />
            {breakdown.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Subject totals appear after you log a session.</p>
            ) : (
              <ul className="space-y-3.5 p-4 sm:p-5">
                {breakdown.map(({ sub, minutes }) => (
                  <li key={sub.id} className="space-y-1.5 rounded-lg p-1.5 -mx-1.5 transition-colors hover:bg-secondary/40">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: sub.color }} aria-hidden />
                        <span className="truncate font-medium">{sub.name}</span>
                        {sub.is_archived && <span className="text-xs text-muted-foreground">archived</span>}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatMinutes(minutes)} · {Math.round((minutes / s.allMin) * 100)}%
                      </span>
                    </div>
                    <ProgressBar size="sm" value={minutes} max={breakdown[0].minutes} color={sub.color} label={`${sub.name} share of study time`} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </PageContainer>
  );
}
