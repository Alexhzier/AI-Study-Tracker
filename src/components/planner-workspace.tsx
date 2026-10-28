"use client";

import { addDays, format, parseISO } from "date-fns";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { approvePlan, archivePlan, generatePlan } from "@/actions/planner";
import { Panel } from "@/components/panel";
import { ProgressBar } from "@/components/progress-bar";
import { Tag } from "@/components/tag";
import { Button } from "@/components/ui/button";
import { WeekStrip } from "@/components/week-strip";
import type { ApprovedPlan, PlanDraft, PlanItem } from "@/lib/ai/types";
import { formatMinutes, todayISO } from "@/lib/time";
import type { Subject } from "@/lib/types";
import { fieldClass } from "@/lib/ui";

export type WeekOption = { key: "this" | "next"; weekStart: string; name: string; range: string; approved: ApprovedPlan | null };

type Row = PlanItem & { id: string };
type Draft = Omit<PlanDraft, "items"> & { items: Row[] };

const dayLabel = (d: string) => format(parseISO(d), "EEE, MMM d");
const weekDates = (start: string) => Array.from({ length: 7 }, (_, i) => format(addDays(parseISO(start), i), "yyyy-MM-dd"));
const compact = `${fieldClass} h-9`;
const SOURCE_LABEL = { ai: "AI suggestion", edited: "Edited by you", manual: "Added by you" } as const;

type Props = {
  subjects: Subject[];
  weeks: WeekOption[];
  enabled: boolean;
  remaining: number;
  limit: number;
  hasAvailability: boolean;
  userId: string;
};

export function PlannerWorkspace({ subjects, weeks, enabled, remaining, limit, hasAvailability, userId }: Props) {
  const [weekKey, setWeekKey] = useState<"this" | "next">("this");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [generating, startGenerate] = useTransition();
  const [approving, startApprove] = useTransition();
  const [restored, setRestored] = useState(false);

  // Drafts are kept on this device so leaving the page (or refreshing) doesn't lose them.
  const storageKey = `study-tracker:planner-draft:v1:${userId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as { weekKey: "this" | "next"; draft: Draft; dirty: boolean };
        const stillValid =
          saved?.draft &&
          Array.isArray(saved.draft.items) &&
          weeks.some((w) => w.key === saved.weekKey && w.weekStart === saved.draft.weekStart);
        if (stillValid) {
          setWeekKey(saved.weekKey);
          setDraft(saved.draft);
          setDirty(Boolean(saved.dirty));
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch {
      /* ignore unreadable saved drafts */
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      if (draft) localStorage.setItem(storageKey, JSON.stringify({ weekKey, draft, dirty }));
      else localStorage.removeItem(storageKey);
    } catch {
      /* storage unavailable: the draft just won't survive leaving the page */
    }
  }, [restored, draft, dirty, weekKey, storageKey]);

  const week = weeks.find((w) => w.key === weekKey)!;
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const today = todayISO();
  const canGenerate = enabled && hasAvailability && subjects.length > 0 && remaining > 0;

  function generate() {
    if (draft && dirty && !confirm("Regenerating replaces your edits. Continue?")) return;
    setGenError(null);
    setApproveError(null);
    startGenerate(async () => {
      const res = await generatePlan(weekKey);
      if (res.error || !res.draft) return setGenError(res.error ?? "Couldn't generate a plan.");
      setDraft({ ...res.draft, items: res.draft.items.map((i) => ({ ...i, id: crypto.randomUUID() })) });
      setDirty(false);
    });
  }

  function update(id: string, patch: Partial<PlanItem>) {
    setDirty(true);
    setDraft((d) =>
      d && { ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...patch, source: i.source === "ai" ? "edited" : i.source } : i)) },
    );
  }

  function addItem(date: string) {
    if (!draft || subjects.length === 0) return;
    setDirty(true);
    setDraft({
      ...draft,
      items: [...draft.items, { id: crypto.randomUUID(), subject_id: subjects[0].id, topic: null, date, duration_minutes: 30, explanation: "", source: "manual" }],
    });
  }

  function remove(id: string) {
    setDirty(true);
    setDraft((d) => d && { ...d, items: d.items.filter((i) => i.id !== id) });
  }

  function discard() {
    if (dirty && !confirm("Discard this draft?")) return;
    setDraft(null);
    setDirty(false);
    setApproveError(null);
  }

  function approve() {
    if (!draft) return;
    if (week.approved && !confirm("This replaces the plan you already approved for this week. Continue?")) return;
    setApproveError(null);
    startApprove(async () => {
      const res = await approvePlan({
        weekStart: draft.weekStart,
        summary: draft.summary,
        model: draft.model,
        items: draft.items.map(({ id: _id, ...rest }) => ({ ...rest, topic: rest.topic?.trim() || null })),
      });
      if (res.error) return setApproveError(res.error);
      toast.success("Plan approved. It now shows on your calendar.");
      setDraft(null);
      setDirty(false);
    });
  }

  const plannable = draft ? weekDates(draft.weekStart).filter((d) => d >= today) : [];
  const total = draft?.items.reduce((n, i) => n + i.duration_minutes, 0) ?? 0;

  const draftActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" onClick={discard} disabled={approving || generating}>Discard</Button>
      <Button variant="outline" onClick={generate} disabled={!canGenerate || approving || generating}>
        <Sparkles className="size-4" aria-hidden /> Regenerate
      </Button>
      <Button onClick={approve} disabled={approving || generating || !draft || draft.items.length === 0}>
        {approving ? "Saving…" : "Approve plan"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* 1. Choose a week and generate */}
      <Panel aria-label="Generate a plan" className="p-4 sm:p-5">
        <fieldset disabled={Boolean(draft) || generating}>
          <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Week to plan</legend>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {weeks.map((w) => (
              <label key={w.key} className="relative cursor-pointer">
                <input type="radio" name="week" value={w.key} checked={weekKey === w.key} onChange={() => setWeekKey(w.key)} className="peer sr-only" />
                <span className="block rounded-xl border border-border/80 bg-background/50 px-3.5 py-2.5 transition-all duration-150 hover:border-primary/40 peer-checked:border-primary peer-checked:bg-accent/70 peer-checked:shadow-xs peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-60">
                  <span className="block text-sm font-semibold text-foreground">{w.name}</span>
                  <span className="block text-xs text-muted-foreground">{w.range}{w.approved ? " · plan approved" : ""}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-4">
          {!enabled ? (
            <p className="text-sm text-muted-foreground">Live generation isn&rsquo;t enabled on this deployment.</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <Link href="/subjects" className="font-medium text-foreground underline underline-offset-4">Add a subject</Link> to start planning.
            </p>
          ) : !hasAvailability ? (
            <p className="text-sm text-muted-foreground">
              Tell the planner when you can study first.{" "}
              <Link href="/planner/settings" className="font-medium text-foreground underline underline-offset-4">Set availability</Link>
            </p>
          ) : (
            <>
              {!draft && (
                <Button onClick={generate} disabled={!canGenerate || generating}>
                  <Sparkles className="size-4" aria-hidden /> {generating ? "Generating…" : "Generate plan"}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                {remaining > 0
                  ? `${remaining} of ${limit} AI plans left in the last 24 hours.`
                  : "You've used your AI plans for now. Each one frees up 24 hours after you generate it."}
                {draft && " Discard the draft to switch weeks."}
              </p>
            </>
          )}
        </div>
      </Panel>

      {/* Errors from generating: calm, specific, with a way forward */}
      {genError && (
        <div role="alert" className="section-fade flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-destructive">Couldn&rsquo;t build a plan</p>
            <p className="mt-0.5 text-sm">{genError}</p>
          </div>
          {canGenerate && <Button variant="outline" size="sm" onClick={generate} disabled={generating}>Try again</Button>}
        </div>
      )}

      {/* 2. Generating */}
      {generating && (
        <Panel aria-busy="true" aria-label="Building your plan" className="section-fade p-4 sm:p-5">
          <p className="text-sm font-semibold">Building your plan</p>
          <p className="mt-0.5 text-sm text-muted-foreground">This usually takes 10 to 30 seconds. You can stay on this page.</p>
          <div className="mt-4 space-y-3 animate-pulse" aria-hidden>
            <div className="h-24 rounded-lg bg-muted/70" />
            <div className="h-14 rounded-lg bg-muted/70" />
            <div className="h-14 rounded-lg bg-muted/70" />
          </div>
        </Panel>
      )}

      {/* 3. Draft: proposed by the AI, not yet on the calendar */}
      {draft && !generating && (
        <section aria-label="Draft plan" className="section-fade space-y-4">
          <Panel className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 bg-secondary/20 p-4 sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone="draft">Draft</Tag>
                  <span className="text-xs text-muted-foreground">Not on your calendar yet</span>
                </div>
                <h2 className="mt-2 text-sm font-semibold tracking-tight">Plan for {week.name.toLowerCase()} ({week.range})</h2>
                <p className="mt-1 max-w-prose text-sm text-muted-foreground">{draft.summary}</p>
              </div>
              {draftActions}
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              <WeekStrip
                days={weekDates(draft.weekStart).map((d) => ({
                  label: format(parseISO(d), "EEE"),
                  planned: draft.items.filter((i) => i.date === d).reduce((n, i) => n + i.duration_minutes, 0),
                  capacity: draft.capacity[d] ?? null,
                  muted: d < today,
                }))}
              />
              {draft.notes && <p className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">{draft.notes}</p>}
              {draft.warnings.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                  {draft.warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              )}
              {week.approved && (
                <p className="text-xs text-muted-foreground">Approving this draft replaces the plan you already approved for this week.</p>
              )}
            </div>
          </Panel>

          {plannable.map((date) => {
            const items = draft.items.filter((i) => i.date === date);
            const minutes = items.reduce((n, i) => n + i.duration_minutes, 0);
            const cap = draft.capacity[date] ?? 0;
            const over = minutes > cap;
            if (items.length === 0 && cap === 0) return null;
            return (
              <Panel key={date} aria-label={dayLabel(date)} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border/60 bg-secondary/15 px-4 py-2.5 sm:px-5">
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-sm font-semibold">{dayLabel(date)}</h3>
                    <span className={`text-xs tabular-nums ${over ? "text-destructive" : "text-muted-foreground"}`}>
                      {formatMinutes(minutes)} of {cap ? formatMinutes(cap) : "0m"} available
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressBar size="sm" className="w-24" value={minutes} max={cap || 1} color={over ? "var(--destructive)" : undefined} label={`${dayLabel(date)} planned time against availability`} />
                    <Button variant="ghost" size="sm" onClick={() => addItem(date)} disabled={subjects.length === 0}>
                      <Plus className="size-4" aria-hidden /> Add
                    </Button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground sm:px-5">Nothing planned for this day.</p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {items.map((it) => (
                      <li key={it.id} className="space-y-2 px-4 py-3 transition-colors hover:bg-secondary/20 sm:px-5">
                        <div className="grid grid-cols-2 gap-2 lg:grid-cols-[1.2fr_1.2fr_1fr_6.5rem_auto]">
                          <select aria-label="Subject" value={it.subject_id} onChange={(e) => update(it.id, { subject_id: e.target.value })} className={compact}>
                            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <input aria-label="Topic (optional)" placeholder="Topic (optional)" maxLength={120} value={it.topic ?? ""} onChange={(e) => update(it.id, { topic: e.target.value })} className={compact} />
                          <select aria-label="Day" value={it.date} onChange={(e) => update(it.id, { date: e.target.value })} className={compact}>
                            {plannable.map((d) => <option key={d} value={d}>{dayLabel(d)}</option>)}
                          </select>
                          <div className="flex items-center gap-1.5">
                            <input aria-label="Minutes" type="number" min={5} max={480} step={5} value={it.duration_minutes}
                              onChange={(e) => update(it.id, { duration_minutes: Math.round(Number(e.target.value)) || 0 })} className={compact} />
                            <span className="text-xs text-muted-foreground">min</span>
                          </div>
                          <Button variant="ghost" size="icon" aria-label="Remove session" onClick={() => remove(it.id)} className="size-9 text-muted-foreground hover:text-destructive">
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </div>
                        <p className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: subjectById.get(it.subject_id)?.color ?? "#999" }} aria-hidden />
                          <span>
                            <span className="mr-2 rounded bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground">{SOURCE_LABEL[it.source]}</span>
                            {it.explanation}
                          </span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            );
          })}

          {approveError && <p role="alert" className="text-sm text-destructive">{approveError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {draft.items.length} {draft.items.length === 1 ? "session" : "sessions"} · {formatMinutes(total)} planned
            </p>
            {draftActions}
          </div>
        </section>
      )}

      {/* 4. Approved: this is what is on the calendar */}
      {!draft && !generating && week.approved && (
        <div key={week.key} className="section-fade">
          <ApprovedView week={week} subjects={subjects} />
        </div>
      )}

      {/* Empty state */}
      {!draft && !generating && !week.approved && !genError && canGenerate && (
        <div key={`empty-${week.key}`} className="section-fade rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center">
          <h2 className="text-sm font-semibold">No plan for {week.name.toLowerCase()} yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Generate a draft from your goals, availability and history. You&rsquo;ll review and edit it before anything is added to your calendar.
          </p>
        </div>
      )}
    </div>
  );
}

function ApprovedView({ week, subjects }: { week: WeekOption; subjects: Subject[] }) {
  const [pending, start] = useTransition();
  const plan = week.approved!;
  const dates = [...new Set(plan.items.map((i) => i.date))].sort();
  const isSample = plan.model === "demo";
  const first = dates[0] ?? week.weekStart;

  return (
    <Panel aria-label="Approved plan" className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 bg-secondary/20 p-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="approved">Approved</Tag>
            {isSample && <Tag tone="sample">Sample plan</Tag>}
            <span className="text-xs text-muted-foreground">On your calendar</span>
          </div>
          <h2 className="mt-2 text-sm font-semibold tracking-tight">{week.name} ({week.range})</h2>
          {plan.summary && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{plan.summary}</p>}
          {isSample && <p className="mt-1 text-xs text-muted-foreground">Created with the demo data, not by the AI. Generate a plan to see live output.</p>}
        </div>
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="sm">
            <Link href={`/calendar?month=${first.slice(0, 7)}&date=${first}`}>View on calendar</Link>
          </Button>
          <Button variant="ghost" size="sm" disabled={pending}
            onClick={() => {
              if (!confirm("Remove this plan? Its sessions disappear from your calendar.")) return;
              start(async () => {
                const r = await archivePlan(plan.id);
                if (r.error) toast.error(r.error); else toast.success("Plan removed");
              });
            }}>
            Remove
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <WeekStrip
          days={weekDates(week.weekStart).map((d) => ({
            label: format(parseISO(d), "EEE"),
            planned: plan.items.filter((i) => i.date === d).reduce((n, i) => n + i.duration_minutes, 0),
            capacity: null,
          }))}
        />
      </div>

      <div className="divide-y divide-border/60 border-t border-border/60">
        {dates.map((d) => (
          <div key={d} className="px-4 py-3.5 transition-colors hover:bg-secondary/20 sm:px-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dayLabel(d)}</h3>
            <ul className="mt-2 space-y-2.5">
              {plan.items.filter((i) => i.date === d).map((i, idx) => {
                const s = subjects.find((x) => x.id === i.subject_id);
                return (
                  <li key={idx}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s?.color ?? "#999" }} aria-hidden />
                        <span className="truncate font-medium">{s?.name ?? "Subject"}{i.topic ? ` · ${i.topic}` : ""}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{formatMinutes(i.duration_minutes)}</span>
                    </div>
                    {i.explanation && <p className="mt-0.5 pl-[1.125rem] text-xs text-muted-foreground">{i.explanation}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}
