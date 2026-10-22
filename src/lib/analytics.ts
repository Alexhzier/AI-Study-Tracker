import { addDays, addMonths, addWeeks, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import type { SessionLite, Subject } from "@/lib/types";

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const hrs = (minutes: number) => Math.round((minutes / 60) * 100) / 100;

function sumBy(rows: SessionLite[], key: (r: SessionLite) => string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    map.set(k, (map.get(k) ?? 0) + r.duration_minutes);
  }
  return map;
}

/** Monday of the week containing the given yyyy-MM-dd date. */
export const weekStartISO = (dateISO: string) => iso(startOfWeek(parseISO(dateISO), { weekStartsOn: 1 }));

export type Point = { label: string; hours: number };

export function dailyForWeek(rows: SessionLite[], weekStart: string): Point[] {
  const byDay = sumBy(rows, (r) => r.session_date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(parseISO(weekStart), i);
    return { label: format(d, "EEE"), hours: hrs(byDay.get(iso(d)) ?? 0) };
  });
}

export function recentWeeks(rows: SessionLite[], today: string, n = 12): Point[] {
  const byWeek = sumBy(rows, (r) => weekStartISO(r.session_date));
  const current = parseISO(weekStartISO(today));
  return Array.from({ length: n }, (_, i) => {
    const d = addWeeks(current, i - (n - 1));
    return { label: format(d, "MMM d"), hours: hrs(byWeek.get(iso(d)) ?? 0) };
  });
}

export function recentMonths(rows: SessionLite[], today: string, n = 12): Point[] {
  const byMonth = sumBy(rows, (r) => r.session_date.slice(0, 7));
  const current = startOfMonth(parseISO(today));
  return Array.from({ length: n }, (_, i) => {
    const d = addMonths(current, i - (n - 1));
    return { label: format(d, "MMM yy"), hours: hrs(byMonth.get(format(d, "yyyy-MM")) ?? 0) };
  });
}

export type SubjectSlice = { name: string; color: string; hours: number; minutes: number };

export function subjectDistribution(rows: SessionLite[], subjects: Subject[]): SubjectSlice[] {
  const bySubject = sumBy(rows, (r) => r.subject_id);
  return subjects
    .map((s) => ({ name: s.name, color: s.color, minutes: bySubject.get(s.id) ?? 0 }))
    .filter((s) => s.minutes > 0)
    .map((s) => ({ ...s, hours: hrs(s.minutes) }))
    .sort((a, b) => b.minutes - a.minutes);
}
