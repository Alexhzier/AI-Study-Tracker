import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { ArchiveButton } from "@/components/archive-button";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { ProgressBar } from "@/components/progress-bar";
import { SubjectDialog } from "@/components/subject-dialog";
import { Button } from "@/components/ui/button";
import { getPlannerSettings } from "@/lib/data/planner";
import { getSessionLite, getSubjects } from "@/lib/data/queries";
import { computeGoalProgress } from "@/lib/goals";
import { totalsBySubject } from "@/lib/stats";
import { formatMinutes, todayISO, weekRange } from "@/lib/time";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Subjects" };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function SubjectsPage() {
  const [subjects, rows, planner] = await Promise.all([getSubjects(), getSessionLite(), getPlannerSettings()]);
  const totals = totalsBySubject(rows);
  const progress = computeGoalProgress(
    rows,
    { daily: planner.dailyGoalMinutes, weekly: planner.weeklyGoalMinutes, targets: planner.weeklyTargets },
    todayISO(),
    weekRange(),
  );
  const weekBySubject = new Map(progress.subjects.map((p) => [p.subject_id, p]));

  const byName = (a: Subject, b: Subject) => a.name.localeCompare(b.name);
  const active = subjects.filter((s) => !s.is_archived).sort(byName);
  const archived = subjects.filter((s) => s.is_archived).sort(byName);
  const allMinutes = rows.reduce((n, r) => n + r.duration_minutes, 0);

  const row = (s: Subject) => {
    const t = totals.get(s.id) ?? { minutes: 0, count: 0 };
    const week = weekBySubject.get(s.id);
    return (
      <li key={s.id} className="group flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-secondary/40 sm:flex-nowrap">
        <span className="size-3 shrink-0 rounded-full transition-transform group-hover:scale-110" style={{ backgroundColor: s.color }} aria-hidden />
        <div className="min-w-0 flex-1 basis-40">
          <Link
            href={`/sessions?subject=${s.id}`}
            aria-label={`${s.name}: view sessions`}
            className={cn("block truncate text-sm font-semibold underline-offset-4 hover:underline", s.is_archived && "text-muted-foreground")}
          >
            {s.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {plural(t.count, "session")}
            {week && (
              <span className="md:hidden"> · {formatMinutes(week.minutes)} of {formatMinutes(week.target)} this week</span>
            )}
          </p>
        </div>

        {week && !s.is_archived && (
          <div className="hidden w-40 shrink-0 md:block">
            <div className="mb-1 flex justify-between text-xs tabular-nums text-muted-foreground">
              <span>This week</span>
              <span>{formatMinutes(week.minutes)} / {formatMinutes(week.target)}</span>
            </div>
            <ProgressBar size="sm" value={week.minutes} max={week.target} color={s.color} label={`${s.name} weekly target`} />
          </div>
        )}

        <p className="w-20 shrink-0 text-right text-sm font-medium tabular-nums">{formatMinutes(t.minutes)}</p>

        <div className="flex shrink-0 gap-0.5 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <SubjectDialog subject={s}>
            <Button variant="ghost" size="icon" aria-label={`Edit ${s.name}`} title={`Edit ${s.name}`} className="size-8 text-muted-foreground">
              <Pencil className="size-3.5" aria-hidden />
            </Button>
          </SubjectDialog>
          <ArchiveButton id={s.id} archived={s.is_archived} name={s.name} compact />
        </div>
      </li>
    );
  };

  return (
    <PageContainer size="content">
      <PageHeader
        title="Subjects"
        description={
          subjects.length === 0
            ? undefined
            : `${active.length} active · ${formatMinutes(allMinutes)} studied. Archiving keeps a subject's history.`
        }
        action={
          subjects.length > 0 ? (
            <SubjectDialog>
              <Button><Plus className="size-4" aria-hidden /> New subject</Button>
            </SubjectDialog>
          ) : undefined
        }
      />

      {subjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-14 text-center">
          <h2 className="text-sm font-semibold">Create your first subject</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Subjects group your study sessions so you can see where your time goes. Add one for each course or topic.
          </p>
          <div className="mt-4 flex justify-center">
            <SubjectDialog>
              <Button><Plus className="size-4" aria-hidden /> New subject</Button>
            </SubjectDialog>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section aria-label="Active subjects">
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">All your subjects are archived. Create a new one or restore one below.</p>
            ) : (
              <Panel className="overflow-hidden"><ul className="divide-y divide-border/60">{active.map(row)}</ul></Panel>
            )}
          </section>
          {archived.length > 0 && (
            <section aria-labelledby="arch-h">
              <div className="mb-2.5 flex items-center gap-3 px-1">
                <h2 id="arch-h" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Archived</h2>
                <div className="h-px flex-1 bg-border/60" aria-hidden />
              </div>
              <Panel className="overflow-hidden opacity-85 transition-opacity hover:opacity-100"><ul className="divide-y divide-border/60">{archived.map(row)}</ul></Panel>
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}
