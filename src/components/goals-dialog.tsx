"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveGoals } from "@/actions/planner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fieldClass } from "@/lib/ui";

const hours = (m?: number | null) => (m ? String(Math.round((m / 60) * 100) / 100) : "");
const toMinutes = (v: string): number | null => (v.trim() === "" ? null : Math.round(Number(v) * 60));

type Props = {
  daily: number | null;
  weekly: number | null;
  subjects: { id: string; name: string; color: string; target: number | null }[];
  children: React.ReactNode;
};

export function GoalsDialog({ children, ...props }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Study goals</DialogTitle>
          <DialogDescription>Leave a field empty to have no goal for it. Hours can be decimals, like 1.5.</DialogDescription>
        </DialogHeader>
        <GoalsForm {...props} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function GoalsForm({ daily, weekly, subjects, onDone }: Omit<Props, "children"> & { onDone: () => void }) {
  const [d, setD] = useState(hours(daily));
  const [w, setW] = useState(hours(weekly));
  const [targets, setTargets] = useState<Record<string, string>>(Object.fromEntries(subjects.map((s) => [s.id, hours(s.target)])));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const dailyMinutes = toMinutes(d);
    const weeklyMinutes = toMinutes(w);
    const subjectTargets = subjects.map((s) => ({ subject_id: s.id, minutes: toMinutes(targets[s.id]) }));
    const all = [dailyMinutes, weeklyMinutes, ...subjectTargets.map((t) => t.minutes)];
    if (all.some((m) => m !== null && !Number.isFinite(m))) return setError("Enter goals as a number of hours.");
    start(async () => {
      const res = await saveGoals({ dailyMinutes, weeklyMinutes, subjectTargets });
      if (res.error) return setError(res.error);
      toast.success("Goals saved");
      onDone();
    });
  }

  const num = `${fieldClass} h-9 w-24`;
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="goal-daily" className="text-sm font-medium">Daily goal</label>
          <div className="flex items-center gap-2">
            <input id="goal-daily" type="number" min={0} max={24} step={0.25} inputMode="decimal" value={d} onChange={(e) => setD(e.target.value)} className={num} />
            <span className="w-8 text-xs text-muted-foreground">hrs</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="goal-weekly" className="text-sm font-medium">Weekly goal</label>
          <div className="flex items-center gap-2">
            <input id="goal-weekly" type="number" min={0} max={168} step={0.5} inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} className={num} />
            <span className="w-8 text-xs text-muted-foreground">hrs</span>
          </div>
        </div>
      </div>

      {subjects.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Weekly target per subject</legend>
          <ul className="divide-y rounded-lg border">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                  <span className="truncate">{s.name}</span>
                </span>
                <div className="flex items-center gap-2">
                  <input aria-label={`Weekly target for ${s.name} in hours`} type="number" min={0} max={168} step={0.5} inputMode="decimal"
                    value={targets[s.id]} onChange={(e) => setTargets({ ...targets, [s.id]: e.target.value })} className={num} />
                  <span className="w-8 text-xs text-muted-foreground">hrs</span>
                </div>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <p className="text-xs text-muted-foreground">
        The planner uses your weekly goal and subject targets when it builds a plan.
      </p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save goals"}</Button>
      </div>
    </form>
  );
}
