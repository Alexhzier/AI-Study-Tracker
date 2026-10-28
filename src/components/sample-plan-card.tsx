import { Panel } from "@/components/panel";
import { Tag } from "@/components/tag";
import { WeekStrip } from "@/components/week-strip";
import { SAMPLE_PLAN } from "@/lib/sample-plan";
import { formatMinutes } from "@/lib/time";

export function SamplePlanCard() {
  const days = SAMPLE_PLAN.days.map((d) => ({
    label: d.label,
    planned: d.items.reduce((n, i) => n + i.minutes, 0),
    capacity: d.capacity || null,
  }));
  const items = SAMPLE_PLAN.days.flatMap((d) => d.items.map((i) => ({ ...i, day: d.label })));

  return (
    <Panel aria-labelledby="sample-h" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/70 bg-secondary/30 px-4 py-3 sm:px-5">
        <Tag tone="sample">Sample</Tag>
        <h2 id="sample-h" className="text-sm font-semibold tracking-tight">What a weekly plan looks like</h2>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <p className="text-sm leading-relaxed text-foreground/90">{SAMPLE_PLAN.summary}</p>
        <WeekStrip days={days} />
        <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/70 bg-background/40">
          {items.map((i, idx) => (
            <li key={idx} className="px-3.5 py-2.5 transition-colors hover:bg-secondary/40">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: i.color }} aria-hidden />
                  <span className="truncate font-medium text-foreground">{i.subject}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{i.day}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums text-muted-foreground">{formatMinutes(i.minutes)}</span>
              </div>
              <p className="mt-1 pl-4 text-xs leading-relaxed text-muted-foreground">{i.why}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-muted-foreground">
          An illustration with sample data, not live AI output. Real plans use your own goals, availability, exams and study
          history, and nothing reaches your calendar until you approve it.
        </p>
      </div>
    </Panel>
  );
}
