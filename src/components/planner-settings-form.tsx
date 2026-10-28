"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePlannerSettings } from "@/actions/planner";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/lib/ui";

const DAYS: [number, string][] = [[1, "Monday"], [2, "Tuesday"], [3, "Wednesday"], [4, "Thursday"], [5, "Friday"], [6, "Saturday"], [7, "Sunday"]];
const hours = (m?: number | null) => (m ? String(Math.round((m / 60) * 100) / 100) : "");
const toMinutes = (v: string) => (v.trim() === "" ? 0 : Math.round(Number(v) * 60));

type Props = {
  weeklyGoalMinutes: number | null;
  availability: Record<number, number>;
  subjects: { id: string; name: string; color: string; priority: number }[];
};

export function PlannerSettingsForm({ weeklyGoalMinutes, availability, subjects }: Props) {
  const [goal, setGoal] = useState(hours(weeklyGoalMinutes));
  const [avail, setAvail] = useState<Record<number, string>>(Object.fromEntries(DAYS.map(([d]) => [d, hours(availability[d])])));
  const [prio, setPrio] = useState<Record<string, number>>(Object.fromEntries(subjects.map((s) => [s.id, s.priority])));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const goalMin = goal.trim() === "" ? null : toMinutes(goal);
    const availability = Object.fromEntries(DAYS.map(([d]) => [String(d), toMinutes(avail[d])]));
    if (goalMin !== null && !Number.isFinite(goalMin)) return setError("Enter the weekly goal as a number of hours.");
    if (Object.values(availability).some((m) => !Number.isFinite(m) || m < 0)) return setError("Enter available time as a number of hours.");
    start(async () => {
      const res = await savePlannerSettings({
        weeklyGoalMinutes: goalMin,
        availability,
        priorities: subjects.map((s) => ({ subject_id: s.id, priority: prio[s.id] })),
      });
      if (res.error) return setError(res.error);
      toast.success("Planner settings saved");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-xl border border-border/80 bg-card p-4 shadow-xs sm:p-5 space-y-2.5">
        <h2 className="text-sm font-semibold tracking-tight">Weekly goal</h2>
        <div className="flex items-center gap-2">
          <input aria-label="Weekly goal in hours" type="number" min={0} max={168} step={0.5} inputMode="decimal" placeholder="e.g. 10"
            value={goal} onChange={(e) => setGoal(e.target.value)} className={`${fieldClass} max-w-32`} />
          <span className="text-sm text-muted-foreground">hours per week</span>
        </div>
        <p className="text-xs text-muted-foreground">Optional. The planner won&rsquo;t schedule more than this, counting what you&rsquo;ve already logged that week.</p>
      </section>

      <section className="space-y-2">
        <div className="px-1">
          <h2 className="text-sm font-semibold tracking-tight">Available study time</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Hours you can study on each day. Leave a day empty if you can&rsquo;t study.</p>
        </div>
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
          {DAYS.map(([d, name]) => (
            <li key={d} className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/25">
              <label htmlFor={`day-${d}`} className="text-sm font-medium">{name}</label>
              <div className="flex items-center gap-2">
                <input id={`day-${d}`} type="number" min={0} max={24} step={0.5} inputMode="decimal" placeholder="0"
                  value={avail[d]} onChange={(e) => setAvail({ ...avail, [d]: e.target.value })} className={`${fieldClass} h-9 w-24`} />
                <span className="w-6 text-xs text-muted-foreground">hrs</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <div className="px-1">
          <h2 className="text-sm font-semibold tracking-tight">Subject priority</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">1 is lowest and 5 is highest. Higher-priority subjects get more of your time.</p>
        </div>
        {subjects.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">Add subjects first to set their priority.</p>
        ) : (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/25">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                  <span className="truncate font-medium">{s.name}</span>
                </span>
                <select aria-label={`Priority for ${s.name}`} value={prio[s.id]} onChange={(e) => setPrio({ ...prio, [s.id]: Number(e.target.value) })} className={`${fieldClass} h-9 w-24`}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
    </form>
  );
}
