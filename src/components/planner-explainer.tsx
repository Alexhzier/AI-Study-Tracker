import { Panel, PanelHeader } from "@/components/panel";

const STEPS = [
  ["You set the inputs", "Weekly goal, the hours you can study each day, subject priorities and real exam dates. Nothing is assumed."],
  ["The app does the maths", "Study totals, recent weeks and gaps are calculated in code from the sessions you logged."],
  ["AI drafts, you decide", "The model proposes sessions. They're checked against your limits, and nothing reaches your calendar until you approve."],
];

export function PlannerExplainer({ isGuest }: { isGuest: boolean }) {
  return (
    <Panel aria-labelledby="how-h">
      <PanelHeader id="how-h" title="How the planner works" />
      <ol className="grid gap-5 p-4 md:grid-cols-3">
        {STEPS.map(([title, body], i) => (
          <li key={title}>
            <p className="text-xs tabular-nums text-muted-foreground">Step {i + 1}</p>
            <p className="mt-0.5 text-sm font-medium">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
      <p className="border-t px-4 py-3 text-xs text-muted-foreground">
        {isGuest
          ? "You're in the demo, so a sample plan for next week is already approved. With little history, the planner says so and relies on your settings instead of guessing habits."
          : "With little history, the planner says so and relies on your settings instead of guessing habits."}
      </p>
    </Panel>
  );
}
