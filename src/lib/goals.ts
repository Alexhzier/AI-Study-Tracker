import { getISODay, parseISO } from "date-fns";
import { computeStreak } from "@/lib/stats";
import type { SessionLite } from "@/lib/types";

export type GoalSettings = {
  daily: number | null;
  weekly: number | null;
  /** subject_id -> weekly target minutes */
  targets: Record<string, number>;
};

export type GoalProgress = {
  todayMinutes: number;
  weekMinutes: number;
  /** Days left this week including today (Monday = 7 ... Sunday = 1). */
  daysLeft: number;
  /** Minutes per day needed over the remaining days to reach the weekly goal. */
  neededPerDay: number;
  /** Consecutive days meeting the daily goal (a day not yet finished doesn't break it). */
  dailyStreak: number;
  subjects: { subject_id: string; minutes: number; target: number }[];
};

/** Everything here is computed from real session rows. Nothing is stored. */
export function computeGoalProgress(
  rows: SessionLite[],
  goals: GoalSettings,
  today: string,
  week: { from: string; to: string },
): GoalProgress {
  const byDay = new Map<string, number>();
  const weekBySubject = new Map<string, number>();
  let weekMinutes = 0;
  for (const r of rows) {
    byDay.set(r.session_date, (byDay.get(r.session_date) ?? 0) + r.duration_minutes);
    if (r.session_date >= week.from && r.session_date <= week.to) {
      weekMinutes += r.duration_minutes;
      weekBySubject.set(r.subject_id, (weekBySubject.get(r.subject_id) ?? 0) + r.duration_minutes);
    }
  }

  const daysLeft = 8 - getISODay(parseISO(today));
  const remaining = goals.weekly ? Math.max(0, goals.weekly - weekMinutes) : 0;

  const metDays = goals.daily
    ? [...byDay.entries()].filter(([, m]) => m >= goals.daily!).map(([d]) => d)
    : [];

  return {
    todayMinutes: byDay.get(today) ?? 0,
    weekMinutes,
    daysLeft,
    neededPerDay: remaining > 0 ? Math.ceil(remaining / daysLeft) : 0,
    dailyStreak: computeStreak(metDays, today),
    subjects: Object.entries(goals.targets).map(([subject_id, target]) => ({
      subject_id,
      target,
      minutes: weekBySubject.get(subject_id) ?? 0,
    })),
  };
}
