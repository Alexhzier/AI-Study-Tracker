import Link from "next/link";
import { Panel, PanelHeader } from "@/components/panel";
import { formatMinutes } from "@/lib/time";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = {
  goalMinutes: number | null;
  availability: Record<number, number>;
  subjects: { id: string; name: string; color: string; priority: number }[];
  exams: { id: string; title: string; subject: string; color: string; date: string; daysUntil: number }[];
};

/** The facts the planner is allowed to use, shown plainly next to the plan. */
export function PlannerInputs({ goalMinutes, availability, subjects, exams }: Props) {
  return (
    <Panel aria-labelledby="inputs-h" className="overflow-hidden">
      <PanelHeader
        id="inputs-h" title="What the planner uses"
        action={<Link href="/planner/settings" className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Edit</Link>}
      />
      <div className="divide-y divide-border/60">
        <section className="p-4 sm:px-5" aria-label="Weekly goal">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly goal</h3>
          <p className="mt-1 text-sm font-medium">{goalMinutes ? formatMinutes(goalMinutes) : <span className="font-normal text-muted-foreground">Not set</span>}</p>
        </section>

        <section className="p-4 sm:px-5" aria-label="Available time">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available time</h3>
          <ul className="mt-2.5 grid grid-cols-7 gap-1 text-center">
            {DAYS.map((d, i) => {
              const m = availability[i + 1] ?? 0;
              return (
                <li key={d} aria-label={`${d}: ${m ? formatMinutes(m) : "not available"}`} className="rounded-md border border-border/60 bg-background/50 py-1.5">
                  <div aria-hidden>
                    <p className="text-[11px] font-medium text-muted-foreground">{d.slice(0, 2)}</p>
                    <p className="mt-0.5 text-xs font-semibold tabular-nums">{m ? formatMinutes(m) : "–"}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="p-4 sm:px-5" aria-label="Subject priorities">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priorities</h3>
          {subjects.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">No subjects yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {[...subjects].sort((a, b) => b.priority - a.priority).map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                    <span className="truncate font-medium">{s.name}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{s.priority} of 5</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="p-4 sm:px-5" aria-label="Upcoming exams">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming exams</h3>
          {exams.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">None added. The planner never guesses exam dates.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {exams.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: e.color }} aria-hidden />
                    <span className="truncate font-medium">{e.title} · {e.subject}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {e.daysUntil === 0 ? "today" : e.daysUntil === 1 ? "tomorrow" : `in ${e.daysUntil} days`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Panel>
  );
}
