import { addDays, format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { ApprovedPlan, Exam, PlanItem, PlannedItem } from "@/lib/ai/types";

export type PlannerSettings = {
  weeklyGoalMinutes: number | null;
  dailyGoalMinutes: number | null;
  /** subject_id -> weekly target minutes (only subjects that have one) */
  weeklyTargets: Record<string, number>;
  /** ISO weekday (1 = Mon) -> available minutes. Missing = not available. */
  availability: Record<number, number>;
  /** subject_id -> priority 1..5 */
  priorities: Record<string, number>;
};

export async function getPlannerSettings(): Promise<PlannerSettings> {
  const supabase = await createClient();
  const [settings, avail, prios] = await Promise.all([
    supabase.from("planner_settings").select("weekly_goal_minutes,daily_goal_minutes").maybeSingle(),
    supabase.from("planner_availability").select("weekday,available_minutes"),
    supabase.from("planner_subject_settings").select("subject_id,priority,weekly_target_minutes"),
  ]);
  for (const r of [settings, avail, prios]) if (r.error) throw new Error(r.error.message);
  return {
    weeklyGoalMinutes: settings.data?.weekly_goal_minutes ?? null,
    dailyGoalMinutes: settings.data?.daily_goal_minutes ?? null,
    weeklyTargets: Object.fromEntries(
      (prios.data ?? []).filter((p: any) => p.weekly_target_minutes).map((p: any) => [p.subject_id, p.weekly_target_minutes]),
    ),
    availability: Object.fromEntries((avail.data ?? []).map((a: any) => [a.weekday, a.available_minutes])),
    priorities: Object.fromEntries((prios.data ?? []).map((p: any) => [p.subject_id, p.priority])),
  };
}

export async function getExams(): Promise<Exam[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exams")
    .select("id,subject_id,title,exam_date,notes")
    .order("exam_date");
  if (error) throw new Error(error.message);
  return (data ?? []) as Exam[];
}

/** Approved plan (with items) for each requested week start. */
export async function getApprovedPlans(weekStarts: string[]): Promise<Record<string, ApprovedPlan>> {
  const supabase = await createClient();
  const { data: plans, error } = await supabase
    .from("study_plans")
    .select("id,week_start,summary")
    .eq("status", "approved")
    .in("week_start", weekStarts);
  if (error) throw new Error(error.message);
  if (!plans?.length) return {};

  const { data: items, error: e2 } = await supabase
    .from("study_plan_items")
    .select("plan_id,subject_id,topic,planned_date,duration_minutes,explanation,source")
    .in("plan_id", plans.map((p: any) => p.id))
    .order("planned_date")
    .order("created_at");
  if (e2) throw new Error(e2.message);

  const out: Record<string, ApprovedPlan> = {};
  for (const p of plans as any[]) {
    out[p.week_start] = {
      id: p.id,
      summary: p.summary,
      items: (items ?? [])
        .filter((i: any) => i.plan_id === p.id)
        .map((i: any): PlanItem => ({
          subject_id: i.subject_id,
          topic: i.topic,
          date: i.planned_date,
          duration_minutes: i.duration_minutes,
          explanation: i.explanation,
          source: i.source,
        })),
    };
  }
  return out;
}

/** Planned items from approved plans within [from, to]. Used by the calendar. */
export async function getPlannedItems(from: string, to: string): Promise<PlannedItem[]> {
  const supabase = await createClient();
  const earliestWeek = format(addDays(parseISO(from), -6), "yyyy-MM-dd");
  const { data: plans, error } = await supabase
    .from("study_plans")
    .select("id")
    .eq("status", "approved")
    .gte("week_start", earliestWeek)
    .lte("week_start", to);
  if (error) throw new Error(error.message);
  if (!plans?.length) return [];

  const { data, error: e2 } = await supabase
    .from("study_plan_items")
    .select("id,subject_id,topic,planned_date,duration_minutes,explanation")
    .in("plan_id", plans.map((p: any) => p.id))
    .gte("planned_date", from)
    .lte("planned_date", to)
    .order("planned_date")
    .order("created_at");
  if (e2) throw new Error(e2.message);
  return (data ?? []) as PlannedItem[];
}
