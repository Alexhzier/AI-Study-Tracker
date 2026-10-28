import { GoalsDialog } from "@/components/goals-dialog";
import { Panel, PanelHeader } from "@/components/panel";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import type { GoalProgress, GoalSettings } from "@/lib/goals";
import { formatMinutes } from "@/lib/time";
import type { Subject } from "@/lib/types";

/** Weekly goal, daily-goal streak and per-subject targets. Today's goal lives in the dashboard hero. */
export function GoalsCard({ goals, progress, subjects }: { goals: GoalSettings; progress: GoalProgress; subjects: Subject[] }) {
  const active = subjects.filter((s) => !s.is_archived);
  const targets = progress.subjects
    .map((p) => ({ ...p, subject: active.find((s) => s.id === p.subject_id) }))
    .filter((p) => p.subject);
  const hasGoals = Boolean(goals.daily || goals.weekly || targets.length);

  const edit = (label: string, variant: "ghost" | "outline") => (
    <GoalsDialog
      daily={goals.daily}
      weekly={goals.weekly}
      subjects={active.map((s) => ({ id: s.id, name: s.name, color: s.color, target: goals.targets[s.id] ?? null }))}
    >
      <Button variant={variant} size="sm">{label}</Button>
    </GoalsDialog>
  );

  return (
    <Panel aria-labelledby="goals-h">
      <PanelHeader id="goals-h" title="Goals" action={hasGoals ? edit("Edit", "ghost") : undefined} />

      {!hasGoals ? (
        <div className="p-5">
          <p className="text-sm text-muted-foreground">Set a daily or weekly target to see your progress here.</p>
          <div className="mt-3.5">{edit("Set goals", "outline")}</div>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {goals.weekly && (
            <section className="space-y-2.5 p-4 sm:p-5" aria-label="Weekly goal">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">This week</span>
                <span className="tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{formatMinutes(progress.weekMinutes)}</span> of {formatMinutes(goals.weekly)}
                </span>
              </div>
              <ProgressBar value={progress.weekMinutes} max={goals.weekly} label="Weekly goal progress" />
              <p className="text-xs text-muted-foreground">
                {progress.weekMinutes >= goals.weekly
                  ? "🎉 Weekly goal reached!"
                  : `${formatMinutes(goals.weekly - progress.weekMinutes)} to go, about ${formatMinutes(progress.neededPerDay)} a day.`}
              </p>
            </section>
          )}

          {goals.daily && (
            <section className="flex items-center justify-between gap-3 p-4 sm:p-5 text-sm" aria-label="Daily goal streak">
              <span className="font-medium text-foreground">Daily streak</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/80 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground ring-1 ring-accent-foreground/20 tabular-nums">
                <span>🔥</span>
                <span>{progress.dailyStreak} {progress.dailyStreak === 1 ? "day" : "days"}</span>
              </span>
            </section>
          )}

          {targets.length > 0 && (
            <section className="space-y-3.5 p-4 sm:p-5" aria-label="Subject targets">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject targets this week</h3>
              {targets.map((t) => (
                <div key={t.subject_id} className="space-y-1.5 rounded-lg p-1.5 -mx-1.5 transition-colors hover:bg-secondary/40">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: t.subject!.color }} aria-hidden />
                      <span className="truncate font-medium">{t.subject!.name}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatMinutes(t.minutes)} of {formatMinutes(t.target)}
                    </span>
                  </div>
                  <ProgressBar size="sm" value={t.minutes} max={t.target} color={t.subject!.color} label={`${t.subject!.name} weekly target`} />
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </Panel>
  );
}
