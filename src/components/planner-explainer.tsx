import { Panel, PanelHeader } from "@/components/panel";

const STEPS = [
  ["You set the inputs", "Weekly goal, the hours you can study each day, subject priorities and real exam dates. Nothing is assumed."],
  ["The app does the maths", "Study totals, recent weeks and gaps are calculated in code from the sessions you logged."],
  ["AI drafts, you decide", "The model proposes sessions. They're checked against your limits, and nothing reaches your calendar until you approve."],
];

export function PlannerExplainer({ isGuest }: { isGuest: boolean }) {
  return (
    <Panel aria-labelledby="how-h" className="overflow-hidden">
      <PanelHeader id="how-h" title="How the planner works" />
      <ol className="grid divide-y divide-border/60 md:grid-cols-3 md:divide-x md:divide-y-0">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="p-4 sm:p-5 transition-colors hover:bg-secondary/25">
            <span className="inline-flex items-center rounded-md bg-accent/80 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-accent-foreground">
              Step {i + 1}
            </span>
            <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
      <p className="border-t border-border/60 bg-secondary/20 px-4 py-3 text-xs text-muted-foreground sm:px-5">
        {isGuest
          ? "You're in the demo, so a sample plan for next week is already approved. With little history, the planner says so and relies on your settings instead of guessing habits."
          : "With little history, the planner says so and relies on your settings instead of guessing habits."}
      </p>
    </Panel>
  );
}
