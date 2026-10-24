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
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Set a daily or weekly target to see your progress here.</p>
          <div className="mt-3">{edit("Set goals", "outline")}</div>
        </div>
      ) : (
        <div className="divide-y">
          {goals.weekly && (
            <section className="space-y-2.5 p-4" aria-label="Weekly goal">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>This week</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatMinutes(progress.weekMinutes)} of {formatMinutes(goals.weekly)}
                </span>
              </div>
              <ProgressBar value={progress.weekMinutes} max={goals.weekly} label="Weekly goal progress" />
              <p className="text-xs text-muted-foreground">
                {progress.weekMinutes >= goals.weekly
                  ? "Weekly goal reached."
                  : `${formatMinutes(goals.weekly - progress.weekMinutes)} to go, about ${formatMinutes(progress.neededPerDay)} a day.`}
              </p>
            </section>
          )}

          {goals.daily && (
            <section className="flex items-baseline justify-between gap-3 p-4 text-sm" aria-label="Daily goal streak">
              <span>Daily goal streak</span>
              <span className="tabular-nums">
                <span className="font-semibold">{progress.dailyStreak}</span>{" "}
                <span className="text-muted-foreground">{progress.dailyStreak === 1 ? "day" : "days"}</span>
              </span>
            </section>
          )}

          {targets.length > 0 && (
            <section className="space-y-3.5 p-4" aria-label="Subject targets">
              <h3 className="text-xs text-muted-foreground">Subject targets this week</h3>
              {targets.map((t) => (
                <div key={t.subject_id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: t.subject!.color }} aria-hidden />
                      <span className="truncate">{t.subject!.name}</span>
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
