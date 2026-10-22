import { addDays, format, parseISO } from "date-fns";
import type { SessionLite } from "@/lib/types";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/** Consecutive days with at least one session. Today not yet studied? The streak still counts through yesterday. */
export function computeStreak(dates: Iterable<string>, today: string) {
  const set = new Set(dates);
  let cursor = set.has(today) ? today : iso(addDays(parseISO(today), -1));
  let n = 0;
  while (set.has(cursor)) {
    n++;
    cursor = iso(addDays(parseISO(cursor), -1));
  }
  return n;
}

type Range = { from: string; to: string };

export function summarize(rows: SessionLite[], today: string, week: Range, month: Range) {
  let todayMin = 0, weekMin = 0, monthMin = 0, allMin = 0;
  const days = new Set<string>();
  for (const r of rows) {
    allMin += r.duration_minutes;
    days.add(r.session_date);
    if (r.session_date === today) todayMin += r.duration_minutes;
    if (r.session_date >= week.from && r.session_date <= week.to) weekMin += r.duration_minutes;
    if (r.session_date >= month.from && r.session_date <= month.to) monthMin += r.duration_minutes;
  }
  return { todayMin, weekMin, monthMin, allMin, streak: computeStreak(days, today) };
}

export function totalsBySubject(rows: SessionLite[]) {
  const map = new Map<string, { minutes: number; count: number }>();
  for (const r of rows) {
    const cur = map.get(r.subject_id) ?? { minutes: 0, count: 0 };
    cur.minutes += r.duration_minutes;
    cur.count += 1;
    map.set(r.subject_id, cur);
  }
  return map;
}

/** 0 = no study (neutral), 1-4 = increasing intensity. */
export function heatLevel(minutes: number) {
  if (minutes <= 0) return 0;
  if (minutes < 60) return 1;
  if (minutes < 120) return 2;
  if (minutes < 240) return 3;
  return 4;
}
