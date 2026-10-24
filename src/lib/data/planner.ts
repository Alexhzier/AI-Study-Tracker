import { addDays, format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { ApprovedPlan, Exam, PlanItem, PlannedItem } from "@/lib/ai/types";

type PrioRow = { subject_id: string; priority: number; weekly_target_minutes: number | null };
type AvailRow = { weekday: number; available_minutes: number };
type PlanRow = { id: string; week_start: string; summary: string | null; model: string | null };
type ItemRow = {
  plan_id: string; subject_id: string; topic: string | null; planned_date: string;
  duration_minutes: number; explanation: string; source: PlanItem["source"];
};

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
      ((prios.data ?? []) as PrioRow[]).flatMap((p): [string, number][] => (p.weekly_target_minutes ? [[p.subject_id, p.weekly_target_minutes]] : [])),
    ),
    availability: Object.fromEntries(((avail.data ?? []) as AvailRow[]).map((a) => [a.weekday, a.available_minutes])),
    priorities: Object.fromEntries(((prios.data ?? []) as PrioRow[]).map((p) => [p.subject_id, p.priority])),
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
    .select("id,week_start,summary,model")
    .eq("status", "approved")
    .in("week_start", weekStarts);
  if (error) throw new Error(error.message);
  if (!plans?.length) return {};

  const { data: items, error: e2 } = await supabase
    .from("study_plan_items")
    .select("plan_id,subject_id,topic,planned_date,duration_minutes,explanation,source")
    .in("plan_id", (plans as PlanRow[]).map((p) => p.id))
    .order("planned_date")
    .order("created_at");
  if (e2) throw new Error(e2.message);

  const out: Record<string, ApprovedPlan> = {};
  for (const p of plans as PlanRow[]) {
    out[p.week_start] = {
      id: p.id,
      summary: p.summary,
      model: p.model,
      items: ((items ?? []) as ItemRow[])
        .filter((i) => i.plan_id === p.id)
        .map((i): PlanItem => ({
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
    .in("plan_id", (plans as PlanRow[]).map((p) => p.id))
    .gte("planned_date", from)
    .lte("planned_date", to)
    .order("planned_date")
    .order("created_at");
  if (e2) throw new Error(e2.message);
  return (data ?? []) as PlannedItem[];
}
