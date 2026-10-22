import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { SessionLite, Subject } from "@/lib/types";
import type { HistoryLevel } from "./types";

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const sum = (n: number, r: SessionLite) => n + r.duration_minutes;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type SubjectStat = {
  subject_id: string;
  total_minutes: number;
  minutes_last_7_days: number;
  minutes_last_28_days: number;
  session_count: number;
  last_studied: string | null;
  days_since_last_study: number | null;
};

export type StudyStats = {
  history_level: HistoryLevel;
  total_sessions: number;
  total_minutes: number;
  active_days: number;
  first_session_date: string | null;
  history_days: number;
  minutes_last_7_days: number;
  minutes_last_28_days: number;
  /** Rolling 7-day totals ending today; index 0 is the most recent week. */
  rolling_weekly_minutes: number[];
  /** Only present when there is enough history to say anything about weekday patterns. */
  weekday_minutes_last_28_days: Record<string, number> | null;
};

/** All numbers the AI sees are computed here, in code, from real session rows. */
export function computeStats(rows: SessionLite[], subjects: Subject[], today: string) {
  const dates = new Set(rows.map((r) => r.session_date));
  const first = rows.reduce<string | null>((m, r) => (m === null || r.session_date < m ? r.session_date : m), null);
  const historyDays = first ? differenceInCalendarDays(parseISO(today), parseISO(first)) + 1 : 0;

  // "Sufficient" is deliberately strict: habits are never inferred from a handful of sessions.
  const level: HistoryLevel =
    rows.length === 0 ? "none" : rows.length < 8 || dates.size < 5 || historyDays < 14 ? "limited" : "sufficient";

  const back = (n: number) => iso(addDays(parseISO(today), -n));
  const inRange = (r: SessionLite, from: string, to: string) => r.session_date >= from && r.session_date <= to;

  const rolling = [0, 1, 2, 3].map((i) =>
    rows.filter((r) => inRange(r, back(7 * i + 6), back(7 * i))).reduce(sum, 0),
  );
  const last28 = rows.filter((r) => r.session_date >= back(27));

  let weekday: Record<string, number> | null = null;
  if (level === "sufficient") {
    weekday = Object.fromEntries(WEEKDAYS.map((d) => [d, 0]));
    for (const r of last28) {
      const idx = (parseISO(r.session_date).getDay() + 6) % 7;
      weekday[WEEKDAYS[idx]] += r.duration_minutes;
    }
  }

  const stats: StudyStats = {
    history_level: level,
    total_sessions: rows.length,
    total_minutes: rows.reduce(sum, 0),
    active_days: dates.size,
    first_session_date: first,
    history_days: historyDays,
    minutes_last_7_days: rolling[0],
    minutes_last_28_days: last28.reduce(sum, 0),
    rolling_weekly_minutes: rolling,
    weekday_minutes_last_28_days: weekday,
  };

  const perSubject: SubjectStat[] = subjects.map((s) => {
    const mine = rows.filter((r) => r.subject_id === s.id);
    const last = mine.reduce<string | null>((m, r) => (m === null || r.session_date > m ? r.session_date : m), null);
    return {
      subject_id: s.id,
      total_minutes: mine.reduce(sum, 0),
      minutes_last_7_days: mine.filter((r) => r.session_date >= back(6)).reduce(sum, 0),
      minutes_last_28_days: mine.filter((r) => r.session_date >= back(27)).reduce(sum, 0),
      session_count: mine.length,
      last_studied: last,
      days_since_last_study: last ? differenceInCalendarDays(parseISO(today), parseISO(last)) : null,
    };
  });

  return { stats, perSubject };
}
