import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SessionDialog } from "@/components/session-dialog";
import { SessionRow } from "@/components/session-row";
import { StudyTimer } from "@/components/study-timer";
import { Button } from "@/components/ui/button";
import { getSessionLite, getSubjects, listSessions } from "@/lib/data/queries";
import { summarize, totalsBySubject } from "@/lib/stats";
import { formatMinutes, monthRange, todayISO, weekRange } from "@/lib/time";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [subjects, rows, recent] = await Promise.all([
    getSubjects(),
    getSessionLite(),
    listSessions({ limit: 6 }),
  ]);

  const s = summarize(rows, todayISO(), weekRange(), monthRange());
  const totals = totalsBySubject(rows);
  const breakdown = subjects
    .map((sub) => ({ sub, ...(totals.get(sub.id) ?? { minutes: 0, count: 0 }) }))
    .filter((r) => r.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const stats = [
    { label: "Today", value: formatMinutes(s.todayMin) },
    { label: "This week", value: formatMinutes(s.weekMin) },
    { label: "This month", value: formatMinutes(s.monthMin) },
    { label: "All time", value: formatMinutes(s.allMin) },
    { label: "Streak", value: `${s.streak} ${s.streak === 1 ? "day" : "days"}` },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        action={
          <SessionDialog subjects={subjects}>
            <Button><Plus className="size-4" aria-hidden /> Log session</Button>
          </SessionDialog>
        }
      />

      <StudyTimer subjects={subjects.filter((x) => !x.is_archived)} />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((st) => (
          <div key={st.label} className="rounded-lg border bg-card px-4 py-3 shadow-xs">
            <dt className="text-xs text-muted-foreground">{st.label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{st.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="recent-h" className="rounded-lg border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 id="recent-h" className="text-sm font-semibold">Recent sessions</h2>
            <Link href="/sessions" className="text-xs text-muted-foreground underline-offset-4 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No sessions yet. {subjects.length === 0 ? (
                <>Start by <Link href="/subjects" className="font-medium text-foreground underline underline-offset-4">adding a subject</Link>.</>
              ) : "Log your first session to see it here."}
            </p>
          ) : (
            <ul className="divide-y">
              {recent.map((r) => <SessionRow key={r.id} session={r} subjects={subjects} showDate />)}
            </ul>
          )}
        </section>

        <section aria-labelledby="subj-h" className="rounded-lg border bg-card shadow-xs">
          <div className="border-b px-4 py-3">
            <h2 id="subj-h" className="text-sm font-semibold">Time by subject</h2>
          </div>
          {breakdown.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Subject totals appear after you log a session.</p>
          ) : (
            <ul className="space-y-4 p-4">
              {breakdown.map(({ sub, minutes }) => (
                <li key={sub.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: sub.color }} aria-hidden />
                      <span className="truncate">{sub.name}</span>
                      {sub.is_archived && <span className="text-xs text-muted-foreground">archived</span>}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatMinutes(minutes)} · {Math.round((minutes / s.allMin) * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(minutes / breakdown[0].minutes) * 100}%`, backgroundColor: sub.color }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
