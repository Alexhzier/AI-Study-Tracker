import { addDays, format, getISODay, parseISO } from "date-fns";
import { getExams, getPlannerSettings } from "@/lib/data/planner";
import { getSessionLite, getSubjects } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";
import { APP_TZ, todayISO } from "@/lib/time";
import { computeStats, type StudyStats, type SubjectStat } from "./stats";

export const MIN_SESSION = 15;
const iso = (d: Date) => format(d, "yyyy-MM-dd");

export type PlanningContext = {
  today: string;
  weekStart: string;
  weekEnd: string;
  timezone: string;
  subjects: { id: string; name: string; priority: number; weeklyTargetMinutes: number | null; loggedThisWeek: number }[];
  exams: { subject_id: string; title: string; date: string; days_until: number }[];
  /** Plannable date -> minutes available. Past days and days with <15 min are absent. */
  capacity: Record<string, number>;
  goalMinutes: number | null;
  loggedThisWeek: number;
  budgetMinutes: number;
  stats: StudyStats;
  subjectStats: SubjectStat[];
  recentNotes: { subject_id: string; date: string; text: string }[];
};

export async function buildPlanningContext(weekStart: string): Promise<PlanningContext | { error: string }> {
  const today = todayISO();
  const weekEnd = iso(addDays(parseISO(weekStart), 6));
  const supabase = await createClient();

  const [allSubjects, rows, settings, exams, notesRes] = await Promise.all([
    getSubjects(),
    getSessionLite(),
    getPlannerSettings(),
    getExams(),
    supabase
      .from("study_sessions")
      .select("subject_id,session_date,notes")
      .not("notes", "is", null)
      .order("session_date", { ascending: false })
      .limit(8),
  ]);

  const subjects = allSubjects.filter((s) => !s.is_archived);
  if (subjects.length === 0) return { error: "Add at least one subject before generating a plan." };

  // Capacity: what the user said they have, minus what they've already logged today.
  const loggedByDate = new Map<string, number>();
  for (const r of rows) loggedByDate.set(r.session_date, (loggedByDate.get(r.session_date) ?? 0) + r.duration_minutes);

  const capacity: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const date = iso(addDays(parseISO(weekStart), i));
    if (date < today) continue;
    let minutes = settings.availability[getISODay(parseISO(date))] ?? 0;
    if (date === today) minutes = Math.max(0, minutes - (loggedByDate.get(date) ?? 0));
    minutes = Math.floor(minutes / 5) * 5;
    if (minutes >= MIN_SESSION) capacity[date] = minutes;
  }
  const capacityTotal = Object.values(capacity).reduce((a, b) => a + b, 0);
  if (capacityTotal === 0) {
    return {
      error: Object.keys(settings.availability).length === 0
        ? "Set your available study days and hours first."
        : "No available study time is left in that week. Pick another week or adjust your availability.",
    };
  }

  const loggedThisWeek = rows
    .filter((r) => r.session_date >= weekStart && r.session_date <= weekEnd)
    .reduce((n, r) => n + r.duration_minutes, 0);

  let budget = capacityTotal;
  if (settings.weeklyGoalMinutes) {
    budget = Math.min(capacityTotal, Math.max(0, settings.weeklyGoalMinutes - loggedThisWeek));
    if (budget < MIN_SESSION) {
      return { error: "You've already reached your weekly goal for that week. Raise the goal in planner settings to plan more." };
    }
  }

  const weekBySubject = new Map<string, number>();
  for (const r of rows) {
    if (r.session_date >= weekStart && r.session_date <= weekEnd) {
      weekBySubject.set(r.subject_id, (weekBySubject.get(r.subject_id) ?? 0) + r.duration_minutes);
    }
  }

  const { stats, perSubject } = computeStats(rows, subjects, today);
  const active = new Set(subjects.map((s) => s.id));

  return {
    today,
    weekStart,
    weekEnd,
    timezone: APP_TZ,
    subjects: subjects.map((s) => ({
      id: s.id,
      name: s.name,
      priority: settings.priorities[s.id] ?? 3,
      weeklyTargetMinutes: settings.weeklyTargets[s.id] ?? null,
      loggedThisWeek: weekBySubject.get(s.id) ?? 0,
    })),
    exams: exams
      .filter((e) => e.exam_date >= today && active.has(e.subject_id))
      .slice(0, 20)
      .map((e) => ({
        subject_id: e.subject_id,
        title: e.title,
        date: e.exam_date,
        days_until: Math.round((parseISO(e.exam_date).getTime() - parseISO(today).getTime()) / 86_400_000),
      })),
    capacity,
    goalMinutes: settings.weeklyGoalMinutes,
    loggedThisWeek,
    budgetMinutes: Math.floor(budget / 5) * 5,
    stats,
    subjectStats: perSubject,
    recentNotes: ((notesRes.data ?? []) as any[])
      .filter((n) => active.has(n.subject_id))
      .map((n) => ({
        subject_id: n.subject_id,
        date: n.session_date,
        text: String(n.notes).replace(/\s+/g, " ").trim().slice(0, 140),
      })),
  };
}
