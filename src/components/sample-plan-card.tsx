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
    <Panel aria-labelledby="sample-h">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3">
        <Tag tone="sample">Sample</Tag>
        <h2 id="sample-h" className="text-sm font-semibold">What a weekly plan looks like</h2>
      </div>
      <div className="space-y-4 p-4">
        <p className="text-sm">{SAMPLE_PLAN.summary}</p>
        <WeekStrip days={days} />
        <ul className="divide-y rounded-md border">
          {items.map((i, idx) => (
            <li key={idx} className="px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: i.color }} aria-hidden />
                  <span className="truncate font-medium">{i.subject}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{i.day}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{formatMinutes(i.minutes)}</span>
              </div>
              <p className="mt-1 pl-4 text-xs text-muted-foreground">{i.why}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          An illustration with sample data, not live AI output. Real plans use your own goals, availability, exams and study
          history, and nothing reaches your calendar until you approve it.
        </p>
      </div>
    </Panel>
  );
}
