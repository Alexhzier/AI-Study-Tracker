import { Check, Target } from "lucide-react";
import { GoalsDialog } from "@/components/goals-dialog";
import { Button } from "@/components/ui/button";
import type { GoalProgress, GoalSettings } from "@/lib/goals";
import { formatMinutes } from "@/lib/time";
import type { Subject } from "@/lib/types";

function Bar({ label, value, goal, color, note, dot }: {
  label: string; value: number; goal: number; color?: string; note?: string; dot?: string;
}) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  const done = value >= goal;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          {dot && <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} aria-hidden />}
          <span className="truncate">{label}</span>
          {done && <Check className="size-3.5 shrink-0 text-primary" aria-label="Goal reached" />}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{formatMinutes(value)} / {formatMinutes(goal)}</span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mt-1.5 h-1.5 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%`, ...(color ? { backgroundColor: color } : {}) }} />
      </div>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

export function GoalsCard({ goals, progress, subjects }: { goals: GoalSettings; progress: GoalProgress; subjects: Subject[] }) {
  const active = subjects.filter((s) => !s.is_archived);
  const targetRows = progress.subjects
    .map((p) => ({ ...p, subject: active.find((s) => s.id === p.subject_id) }))
    .filter((p) => p.subject);
  const hasGoals = Boolean(goals.daily || goals.weekly || targetRows.length);

  const dialog = (label: string) => (
    <GoalsDialog
      daily={goals.daily}
      weekly={goals.weekly}
      subjects={active.map((s) => ({ id: s.id, name: s.name, color: s.color, target: goals.targets[s.id] ?? null }))}
    >
      <Button variant="outline" size="sm">{label}</Button>
    </GoalsDialog>
  );

  return (
    <section aria-labelledby="goals-h" className="mt-6 rounded-lg border bg-card shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 id="goals-h" className="flex items-center gap-2 text-sm font-semibold">
          <Target className="size-4" aria-hidden /> Goals
        </h2>
        {hasGoals && dialog("Edit goals")}
      </div>

      {!hasGoals ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-6">
          <p className="text-sm text-muted-foreground">Set a daily or weekly target to see your progress here.</p>
          {dialog("Set goals")}
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-5 p-4 md:grid-cols-2">
          {goals.daily && (
            <Bar
              label="Today" value={progress.todayMinutes} goal={goals.daily}
              note={
                progress.todayMinutes >= goals.daily
                  ? "Daily goal reached."
                  : `${formatMinutes(goals.daily - progress.todayMinutes)} to go.`
              }
            />
          )}
          {goals.weekly && (
            <Bar
              label="This week" value={progress.weekMinutes} goal={goals.weekly}
              note={
                progress.weekMinutes >= goals.weekly
                  ? "Weekly goal reached."
                  : `${formatMinutes(goals.weekly - progress.weekMinutes)} to go · about ${formatMinutes(progress.neededPerDay)} a day for the rest of the week.`
              }
            />
          )}
          {goals.daily && (
            <p className="text-sm md:col-span-2">
              <span className="font-semibold tabular-nums">{progress.dailyStreak}</span>{" "}
              <span className="text-muted-foreground">
                {progress.dailyStreak === 1 ? "day" : "days"} in a row meeting your daily goal
              </span>
            </p>
          )}
          {targetRows.length > 0 && (
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-xs font-medium text-muted-foreground">Subject targets this week</h3>
              <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                {targetRows.map((p) => (
                  <Bar key={p.subject_id} label={p.subject!.name} dot={p.subject!.color} color={p.subject!.color} value={p.minutes} goal={p.target} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
