import { addDays, differenceInCalendarDays, format, getISODay, parseISO } from "date-fns";
import { weekStartISO } from "@/lib/analytics";
import { totalsBySubject } from "@/lib/stats";
import { formatMinutes } from "@/lib/time";
import type { SessionLite, Subject } from "@/lib/types";

export type Insight = { id: string; lead: string; rest: string };

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const sumRange = (rows: SessionLite[], from: string, to: string) =>
  rows.filter((r) => r.session_date >= from && r.session_date <= to).reduce((n, r) => n + r.duration_minutes, 0);

/**
 * Plain arithmetic over real session rows. Every statement is either computed from the data
 * or says that there isn't enough data yet.
 */
export function computeInsights(rows: SessionLite[], subjects: Subject[], weeklyGoal: number | null, today: string): Insight[] {
  if (rows.length === 0) return [];
  const out: Insight[] = [];
  const total = rows.reduce((n, r) => n + r.duration_minutes, 0);

  // 1. Most studied subject
  const top = [...totalsBySubject(rows).entries()].sort((a, b) => b[1].minutes - a[1].minutes)[0];
  const topSubject = subjects.find((s) => s.id === top?.[0]);
  if (top && topSubject) {
    out.push({
      id: "top-subject",
      lead: topSubject.name,
      rest: ` is your most studied subject: ${formatMinutes(top[1].minutes)}, ${Math.round((top[1].minutes / total) * 100)}% of all your study time.`,
    });
  }

  // 2. This week so far, against the same days last week (a fair comparison mid-week)
  const weekStart = weekStartISO(today);
  const weekdayNumber = getISODay(parseISO(today));
  const thisMin = sumRange(rows, weekStart, today);
  const lastStart = iso(addDays(parseISO(weekStart), -7));
  const lastMin = sumRange(rows, lastStart, iso(addDays(parseISO(lastStart), weekdayNumber - 1)));
  if (thisMin > 0 || lastMin > 0) {
    if (lastMin === 0) {
      out.push({ id: "week-change", lead: `${formatMinutes(thisMin)} so far this week`, rest: ". You didn't log any study on the same days last week." });
    } else {
      const diff = thisMin - lastMin;
      const pct = Math.round((Math.abs(diff) / lastMin) * 100);
      out.push({
        id: "week-change",
        lead: `${formatMinutes(thisMin)} so far this week`,
        rest: diff === 0
          ? ", the same as the same days last week."
          : `, ${formatMinutes(Math.abs(diff))} ${diff > 0 ? "more" : "less"} than the same days last week (${diff > 0 ? "+" : "−"}${pct}%).`,
      });
    }
  }

  // 3. Most active weekday, only once there is enough history to mean something
  const dates = new Set(rows.map((r) => r.session_date));
  const first = rows.reduce((m, r) => (r.session_date < m ? r.session_date : m), rows[0].session_date);
  const historyDays = differenceInCalendarDays(parseISO(today), parseISO(first)) + 1;
  if (historyDays >= 14 && dates.size >= 5) {
    const back = iso(addDays(parseISO(today), -55));
    const windowStart = back > first ? back : first;
    const days = differenceInCalendarDays(parseISO(today), parseISO(windowStart)) + 1;
    const minutes = Array<number>(8).fill(0);
    const occurrences = Array<number>(8).fill(0);
    for (let i = 0; i < days; i++) occurrences[getISODay(addDays(parseISO(windowStart), i))]++;
    for (const r of rows) {
      if (r.session_date >= windowStart && r.session_date <= today) minutes[getISODay(parseISO(r.session_date))] += r.duration_minutes;
    }
    let best = 1;
    for (let d = 2; d <= 7; d++) if (minutes[d] > minutes[best]) best = d;
    if (minutes[best] > 0) {
      const name = format(addDays(parseISO(weekStart), best - 1), "EEEE");
      const avg = Math.round(minutes[best] / Math.max(1, occurrences[best]));
      out.push({ id: "weekday", lead: name, rest: ` is your most active day, averaging ${formatMinutes(avg)} each ${name} over the last ${days} days.` });
    }
  } else {
    out.push({ id: "weekday", lead: "Most active day", rest: " needs about two weeks of history before it means anything." });
  }

  // 4. Weekly goal
  if (weeklyGoal) {
    out.push(
      thisMin >= weeklyGoal
        ? { id: "goal", lead: "Weekly goal reached", rest: `: ${formatMinutes(thisMin)} of ${formatMinutes(weeklyGoal)}.` }
        : {
            id: "goal",
            lead: `${Math.round((thisMin / weeklyGoal) * 100)}% of your ${formatMinutes(weeklyGoal)} weekly goal`,
            rest: `, with ${formatMinutes(weeklyGoal - thisMin)} to go.`,
          },
    );
  }
  return out;
}
