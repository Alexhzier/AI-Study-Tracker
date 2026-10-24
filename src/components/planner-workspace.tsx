"use client";

import { addDays, format, parseISO } from "date-fns";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { approvePlan, archivePlan, generatePlan } from "@/actions/planner";
import { Button } from "@/components/ui/button";
import type { ApprovedPlan, PlanDraft, PlanItem } from "@/lib/ai/types";
import { formatMinutes, todayISO } from "@/lib/time";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/lib/ui";

export type WeekOption = { key: "this" | "next"; weekStart: string; label: string; approved: ApprovedPlan | null };

type Row = PlanItem & { id: string };
type Draft = Omit<PlanDraft, "items"> & { items: Row[] };

const dayLabel = (d: string) => format(parseISO(d), "EEE, MMM d");
const compact = `${fieldClass} h-9`;

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
  const [error, setError] = useState<string | null>(null);
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

  function generate() {
    if (draft && dirty && !confirm("Regenerating replaces your edits. Continue?")) return;
    setError(null);
    startGenerate(async () => {
      const res = await generatePlan(weekKey);
      if (res.error || !res.draft) return setError(res.error ?? "Couldn't generate a plan.");
      setDraft({ ...res.draft, items: res.draft.items.map((i) => ({ ...i, id: crypto.randomUUID() })) });
      setDirty(false);
    });
  }

  function update(id: string, patch: Partial<PlanItem>) {
    setDirty(true);
    setDraft((d) =>
      d && {
        ...d,
        items: d.items.map((i) => (i.id === id ? { ...i, ...patch, source: i.source === "ai" ? "edited" : i.source } : i)),
      },
    );
  }

  function addItem(date: string) {
    if (!draft || subjects.length === 0) return;
    setDirty(true);
    setDraft({
      ...draft,
      items: [
        ...draft.items,
        { id: crypto.randomUUID(), subject_id: subjects[0].id, topic: null, date, duration_minutes: 30, explanation: "", source: "manual" },
      ],
    });
  }

  function remove(id: string) {
    setDirty(true);
    setDraft((d) => d && { ...d, items: d.items.filter((i) => i.id !== id) });
  }

  function approve() {
    if (!draft) return;
    if (week.approved && !confirm("This replaces the plan you already approved for this week. Continue?")) return;
    setError(null);
    startApprove(async () => {
      const res = await approvePlan({
        weekStart: draft.weekStart,
        summary: draft.summary,
        model: draft.model,
        items: draft.items.map(({ id: _id, ...rest }) => ({ ...rest, topic: rest.topic?.trim() || null })),
      });
      if (res.error) return setError(res.error);
      toast.success("Plan approved. It now shows on your calendar.");
      setDraft(null);
      setDirty(false);
    });
  }

  const today = todayISO();
  const weekDays = draft
    ? Array.from({ length: 7 }, (_, i) => format(addDays(parseISO(draft.weekStart), i), "yyyy-MM-dd")).filter((d) => d >= today)
    : [];
  const totalPlanned = draft?.items.reduce((n, i) => n + i.duration_minutes, 0) ?? 0;

  return (
    <div className="space-y-6">
      {!enabled && (
        <p role="status" className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">
          Live AI generation isn&rsquo;t enabled on this server.
        </p>
      )}
      {enabled && !hasAvailability && (
        <p role="status" className="rounded-md bg-accent px-4 py-3 text-sm text-accent-foreground">
          Tell the planner when you can study first.{" "}
          <Link href="/planner/settings" className="font-medium underline underline-offset-4">Set availability</Link>
        </p>
      )}
      {subjects.length === 0 && (
        <p role="status" className="rounded-md bg-accent px-4 py-3 text-sm text-accent-foreground">
          Add a subject before planning.{" "}
          <Link href="/subjects" className="font-medium underline underline-offset-4">Go to subjects</Link>
        </p>
      )}

      <section aria-label="Generate a plan" className="rounded-lg border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1 space-y-1.5">
            <label htmlFor="week" className="text-sm font-medium">Week to plan</label>
            <select id="week" value={weekKey} disabled={Boolean(draft) || generating} onChange={(e) => setWeekKey(e.target.value as "this" | "next")} className={fieldClass}>
              {weeks.map((w) => (
                <option key={w.key} value={w.key}>{w.label}{w.approved ? " · plan approved" : ""}</option>
              ))}
            </select>
          </div>
          <Button onClick={generate} disabled={!enabled || !hasAvailability || subjects.length === 0 || generating || approving}>
            <Sparkles className="size-4" aria-hidden />
            {generating ? "Generating…" : draft ? "Regenerate" : "Generate plan"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {enabled ? `${remaining} of ${limit} AI plans left in the last 24 hours.` : "Live generation is turned off on this deployment."}
          {draft && " Discard the draft to switch weeks."}
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </section>

      {draft && (
        <section aria-label="Draft plan" className="space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-xs">
            <h2 className="text-sm font-semibold">Draft for {week.label}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Saved on this device until you approve or discard it.</p>
            <p className="mt-1 text-sm">{draft.summary}</p>
            {draft.notes && <p className="mt-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{draft.notes}</p>}
            {draft.warnings.length > 0 && (
              <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                {draft.warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            )}
          </div>

          {weekDays.map((date) => {
            const items = draft.items.filter((i) => i.date === date);
            const minutes = items.reduce((n, i) => n + i.duration_minutes, 0);
            const cap = draft.capacity[date] ?? 0;
            const over = minutes > cap;
            if (items.length === 0 && cap === 0) return null;
            return (
              <div key={date} className="rounded-lg border bg-card shadow-xs">
                <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
                  <h3 className="text-sm font-semibold">{dayLabel(date)}</h3>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs tabular-nums", over ? "text-destructive" : "text-muted-foreground")}>
                      {formatMinutes(minutes)} of {cap ? formatMinutes(cap) : "0m"} available
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => addItem(date)} disabled={subjects.length === 0}>
                      <Plus className="size-4" aria-hidden /> Add
                    </Button>
                  </div>
                </div>
                {items.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground">Nothing planned.</p>
                ) : (
                  <ul className="divide-y">
                    {items.map((it) => (
                      <li key={it.id} className="space-y-2 px-4 py-3">
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-[1.2fr_1.2fr_1fr_6rem_auto]">
                          <select aria-label="Subject" value={it.subject_id} onChange={(e) => update(it.id, { subject_id: e.target.value })} className={compact}>
                            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <input aria-label="Topic (optional)" placeholder="Topic (optional)" maxLength={120} value={it.topic ?? ""} onChange={(e) => update(it.id, { topic: e.target.value })} className={compact} />
                          <select aria-label="Day" value={it.date} onChange={(e) => update(it.id, { date: e.target.value })} className={compact}>
                            {weekDays.map((d) => <option key={d} value={d}>{dayLabel(d)}</option>)}
                          </select>
                          <div className="flex items-center gap-1.5">
                            <input aria-label="Minutes" type="number" min={5} max={480} step={5} value={it.duration_minutes}
                              onChange={(e) => update(it.id, { duration_minutes: Math.round(Number(e.target.value)) || 0 })} className={compact} />
                            <span className="text-xs text-muted-foreground">min</span>
                          </div>
                          <Button variant="ghost" size="icon" aria-label="Remove session" onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </div>
                        <p className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-0.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: subjectById.get(it.subject_id)?.color ?? "#999" }} aria-hidden />
                          <span>
                            {it.explanation || "Added by you."}
                            {it.source === "edited" && " (edited)"}
                          </span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {draft.items.length} {draft.items.length === 1 ? "session" : "sessions"} · {formatMinutes(totalPlanned)} planned
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={approving} onClick={() => { if (!dirty || confirm("Discard this draft?")) { setDraft(null); setDirty(false); setError(null); } }}>
                Discard
              </Button>
              <Button onClick={approve} disabled={approving || draft.items.length === 0}>
                {approving ? "Saving…" : "Approve plan"}
              </Button>
            </div>
          </div>
        </section>
      )}

      {week.approved && !draft && <ApprovedList plan={week.approved} label={week.label} subjects={subjects} />}
    </div>
  );
}

function ApprovedList({ plan, label, subjects }: { plan: ApprovedPlan; label: string; subjects: Subject[] }) {
  const [pending, start] = useTransition();
  const dates = [...new Set(plan.items.map((i) => i.date))].sort();
  return (
    <section aria-label="Approved plan" className="rounded-lg border bg-card shadow-xs">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Approved plan · {label}</h2>
          {plan.summary && <p className="mt-0.5 text-xs text-muted-foreground">{plan.summary}</p>}
        </div>
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
      <div className="divide-y">
        {dates.map((d) => (
          <div key={d} className="px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">{dayLabel(d)}</p>
            <ul className="mt-1.5 space-y-1.5">
              {plan.items.filter((i) => i.date === d).map((i, idx) => {
                const s = subjects.find((x) => x.id === i.subject_id);
                return (
                  <li key={idx} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s?.color ?? "#999" }} aria-hidden />
                      <span className="truncate">{s?.name ?? "Subject"}{i.topic ? ` · ${i.topic}` : ""}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{formatMinutes(i.duration_minutes)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
