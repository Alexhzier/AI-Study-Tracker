import { MIN_SESSION, type PlanningContext } from "./context";
import type { AiItem, PlanItem } from "./types";

const MAX_SESSION = 180;
const floor5 = (n: number) => Math.floor(n / 5) * 5;

/**
 * Never trust model output. Every item is checked against real data and, where it can be
 * repaired safely (duration rounding, trimming to fit), repaired; otherwise it is dropped.
 */
export function validateAiItems(raw: AiItem[], ctx: PlanningContext) {
  const known = new Set(ctx.subjects.map((s) => s.id));
  const examDates = new Map<string, string[]>();
  for (const e of ctx.exams) examDates.set(e.subject_id, [...(examDates.get(e.subject_id) ?? []), e.date]);

  let invalid = 0;
  let afterExam = 0;
  let adjusted = 0;
  let overflow = 0;

  const cleaned: PlanItem[] = [];
  for (const r of raw) {
    const explanation = (r.explanation ?? "").trim().slice(0, 500);
    if (!known.has(r.subject_id) || ctx.capacity[r.date] === undefined || !explanation) {
      invalid++;
      continue;
    }
    // A session after the subject's last upcoming exam has no purpose.
    const exams = examDates.get(r.subject_id);
    if (exams && exams.every((d) => d < r.date)) {
      afterExam++;
      continue;
    }
    const duration = Math.min(MAX_SESSION, Math.max(MIN_SESSION, Math.round(r.duration_minutes / 5) * 5));
    if (duration !== r.duration_minutes) adjusted++;
    cleaned.push({
      subject_id: r.subject_id,
      topic: r.topic?.trim().slice(0, 120) || null,
      date: r.date,
      duration_minutes: duration,
      explanation,
      source: "ai",
    });
  }

  // Enforce per-day capacity and the weekly budget, trimming later items first.
  cleaned.sort((a, b) => a.date.localeCompare(b.date));
  const perDay = new Map<string, number>();
  let total = 0;
  const items: PlanItem[] = [];
  for (const it of cleaned) {
    const dayLeft = ctx.capacity[it.date] - (perDay.get(it.date) ?? 0);
    const budgetLeft = ctx.budgetMinutes - total;
    const allowed = floor5(Math.min(dayLeft, budgetLeft, it.duration_minutes));
    if (allowed < MIN_SESSION) {
      overflow++;
      continue;
    }
    if (allowed < it.duration_minutes) adjusted++;
    items.push({ ...it, duration_minutes: allowed });
    perDay.set(it.date, (perDay.get(it.date) ?? 0) + allowed);
    total += allowed;
  }

  const warnings: string[] = [];
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
  if (invalid) warnings.push(`${plural(invalid, "suggestion")} referenced an unknown subject or an unavailable day and was removed.`);
  if (afterExam) warnings.push(`${plural(afterExam, "suggestion")} fell after the subject's last exam and was removed.`);
  if (overflow) warnings.push(`${plural(overflow, "suggestion")} didn't fit your available time or weekly goal and was removed.`);
  if (adjusted) warnings.push(`${plural(adjusted, "session")} had its length adjusted to fit your limits.`);

  return { items, warnings };
}
