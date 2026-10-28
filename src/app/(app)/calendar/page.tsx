import type { Metadata } from "next";
import Link from "next/link";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isValid, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { ScrollToDetail } from "@/components/scroll-to-detail";
import { SessionDialog } from "@/components/session-dialog";
import { SessionRow } from "@/components/session-row";
import { Button } from "@/components/ui/button";
import type { PlannedItem } from "@/lib/ai/types";
import { getPlannedItems } from "@/lib/data/planner";
import { getSubjects, listSessions } from "@/lib/data/queries";
import { heatLevel } from "@/lib/stats";
import { formatMinutes, todayISO } from "@/lib/time";
import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar" };

const HEAT = [
  "bg-card hover:bg-secondary",
  "bg-heat-1 text-foreground",
  "bg-heat-2 text-foreground",
  "bg-heat-3 text-foreground",
  "bg-heat-4 text-heat-4-foreground",
];
const LEGEND = ["None", "< 1h", "1–2h", "2–4h", "4h+"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Exact minutes, never rounded decimals. Stacks on narrow cells so nothing is truncated. */
function CellDuration({ minutes }: { minutes: number }) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (
    <span className="flex flex-col text-[11px] font-medium leading-tight tabular-nums sm:flex-row sm:gap-1 sm:text-xs" aria-hidden>
      {h > 0 && <span>{h}h</span>}
      {(m > 0 || h === 0) && <span>{m}m</span>}
    </span>
  );
}

/** A planned item counts as done when enough time was actually logged for that subject that day. */
function planProgress(items: PlannedItem[], sessions: Session[], today: string) {
  const pool = new Map<string, number>();
  for (const s of sessions) {
    const k = `${s.session_date}|${s.subject_id}`;
    pool.set(k, (pool.get(k) ?? 0) + s.duration_minutes);
  }
  return items.map((it) => {
    const k = `${it.planned_date}|${it.subject_id}`;
    const have = pool.get(k) ?? 0;
    const used = Math.min(have, it.duration_minutes);
    pool.set(k, have - used);
    const status =
      used >= it.duration_minutes ? "done" : used > 0 ? "partial" : it.planned_date < today ? "missed" : "planned";
    return { item: it, used, status } as const;
  });
}

export default async function CalendarPage({
  searchParams,
}: { searchParams: Promise<{ month?: string; date?: string }> }) {
  const sp = await searchParams;
  const today = todayISO();
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "") ? sp.month! : today.slice(0, 7);
  const monthStart = parseISO(`${month}-01`);
  const from = `${month}-01`;
  const to = format(endOfMonth(monthStart), "yyyy-MM-dd");

  let selected: string | null = null;
  if (sp.date) {
    const d = parseISO(sp.date);
    if (isValid(d) && format(d, "yyyy-MM-dd") === sp.date && sp.date.startsWith(month)) selected = sp.date;
  }
  if (!selected && today.startsWith(month)) selected = today;

  const [subjects, sessions, planned] = await Promise.all([
    getSubjects(),
    listSessions({ from, to }),
    getPlannedItems(from, to),
  ]);

  const byDay = new Map<string, number>();
  for (const s of sessions) byDay.set(s.session_date, (byDay.get(s.session_date) ?? 0) + s.duration_minutes);
  const monthTotal = [...byDay.values()].reduce((a, b) => a + b, 0);

  const plannedByDay = new Map<string, number>();
  for (const p of planned) plannedByDay.set(p.planned_date, (plannedByDay.get(p.planned_date) ?? 0) + p.duration_minutes);
  const progress = planProgress(planned, sessions, today);

  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(monthStart) });
  const offset = (getDay(monthStart) + 6) % 7; // Monday-first grid
  const href = (m: string, d?: string) => `/calendar?month=${m}${d ? `&date=${d}` : ""}`;

  const daySessions = selected ? sessions.filter((s) => s.session_date === selected) : [];
  const dayPlanned = selected ? progress.filter((p) => p.item.planned_date === selected) : [];
  const dayTotal = daySessions.reduce((n, s) => n + s.duration_minutes, 0);
  const dayPlannedTotal = dayPlanned.reduce((n, p) => n + p.item.duration_minutes, 0);

  const bySubject = new Map<string, number>();
  for (const s of daySessions) bySubject.set(s.subject_id, (bySubject.get(s.subject_id) ?? 0) + s.duration_minutes);
  const subjectChips = [...bySubject.entries()]
    .map(([id, minutes]) => ({ subject: subjects.find((x) => x.id === id), minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  const summary = [
    dayTotal ? `${formatMinutes(dayTotal)} studied` : "No study time",
    daySessions.length ? plural(daySessions.length, "session") : null,
    dayPlannedTotal ? `${formatMinutes(dayPlannedTotal)} planned` : null,
  ].filter(Boolean).join(" · ");

  return (
    <PageContainer size="wide">
      <PageHeader title="Calendar" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <section aria-label={`${format(monthStart, "MMMM yyyy")} calendar`} className="rounded-xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-title font-semibold tracking-tight">{format(monthStart, "MMMM yyyy")}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatMinutes(monthTotal)} studied · {plural(byDay.size, "study day")}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon" aria-label="Previous month">
                <Link href={href(format(addMonths(monthStart, -1), "yyyy-MM"))}><ChevronLeft className="size-4" aria-hidden /></Link>
              </Button>
              <Button asChild variant="outline"><Link href={href(today.slice(0, 7), today)}>Today</Link></Button>
              <Button asChild variant="ghost" size="icon" aria-label="Next month">
                <Link href={href(format(addMonths(monthStart, 1), "yyyy-MM"))}><ChevronRight className="size-4" aria-hidden /></Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:gap-1.5" aria-hidden>
            {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
          </div>

          <ol className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {Array.from({ length: offset }).map((_, i) => <li key={`pad-${i}`} aria-hidden />)}
            {days.map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const minutes = byDay.get(iso) ?? 0;
              const plannedMin = plannedByDay.get(iso) ?? 0;
              const isToday = iso === today;
              return (
                <li key={iso}>
                  <Link
                    href={href(month, iso)} scroll={false}
                    aria-label={`${format(day, "EEEE, MMMM d")}: ${minutes ? `${formatMinutes(minutes)} studied` : "no study"}${plannedMin ? `, ${formatMinutes(plannedMin)} planned` : ""}${isToday ? ", today" : ""}`}
                    aria-current={iso === selected ? "date" : undefined}
                    className={cn(
                      "flex min-h-[4.5rem] flex-col justify-between rounded-lg border border-border/70 p-1.5 text-xs transition-all duration-150 sm:min-h-[5.5rem] sm:p-2 lg:min-h-[6.25rem]",
                      HEAT[heatLevel(minutes)],
                      plannedMin > 0 && "border-dashed border-primary",
                      iso === selected && "ring-2 ring-primary ring-offset-1 ring-offset-card shadow-xs",
                    )}
                  >
                    <span className="flex items-start justify-between">
                      <span className={cn("grid min-w-5 place-items-center tabular-nums sm:text-sm", isToday && "size-6 rounded-full bg-foreground font-semibold text-background")}>
                        {format(day, "d")}
                      </span>
                      {plannedMin > 0 && <span className="mt-0.5 size-2 rounded-full border-[1.5px] border-current" aria-hidden />}
                    </span>
                    {minutes > 0 && <CellDuration minutes={minutes} />}
                  </Link>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              Time studied
              <span className="flex items-center gap-1.5">
                {LEGEND.map((label, i) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className={cn("size-3.5 rounded-sm border", HEAT[i].split(" ")[0])} aria-hidden />
                    {label}
                  </span>
                ))}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3.5 rounded-sm border border-dashed border-primary" aria-hidden />
              <span className="size-2 rounded-full border-[1.5px] border-current" aria-hidden />
              Has planned sessions
            </span>
          </div>
        </section>

        <ScrollToDetail trigger={selected ?? month} label="Selected day" className="h-fit overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs xl:sticky xl:top-6">
          {selected ? (
            <div key={selected} className="section-fade">
              <div className="border-b border-border/60 bg-secondary/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold tracking-tight">{format(parseISO(selected), "EEEE, MMMM d, yyyy")}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{summary}</p>
                  </div>
                  {selected <= today && (
                    <SessionDialog subjects={subjects} defaultDate={selected}>
                      <Button size="sm"><Plus className="size-4" aria-hidden /> Add session</Button>
                    </SessionDialog>
                  )}
                </div>
                {subjectChips.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Subjects studied">
                    {subjectChips.map(({ subject, minutes }) => (
                      <li key={subject?.id ?? "unknown"} className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/80 px-2 py-1 text-xs font-medium">
                        <span className="size-2 rounded-full" style={{ backgroundColor: subject?.color ?? "#999" }} aria-hidden />
                        {subject?.name ?? "Subject"}
                        <span className="tabular-nums text-muted-foreground">{formatMinutes(minutes)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {dayPlanned.length > 0 && (
                <div className={cn("p-3.5", daySessions.length > 0 && "border-b border-border/60")}>
                  <h3 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Planned</h3>
                  <ul className="space-y-2">
                    {dayPlanned.map(({ item, used, status }) => {
                      const s = subjects.find((x) => x.id === item.subject_id);
                      return (
                        <li key={item.id} className="rounded-lg border border-dashed border-primary/60 bg-accent/20 px-3 py-2 transition-colors hover:bg-accent/35">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s?.color ?? "#999" }} aria-hidden />
                              <span className="truncate">{s?.name ?? "Subject"}</span>
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatMinutes(item.duration_minutes)}</span>
                          </div>
                          {item.topic && <p className="mt-0.5 text-xs">{item.topic}</p>}
                          {item.explanation && <p className="mt-0.5 text-xs text-muted-foreground">{item.explanation}</p>}
                          <p className={cn("mt-1 text-xs font-medium",
                            status === "done" && "text-primary",
                            status === "missed" && "text-destructive",
                            (status === "planned" || status === "partial") && "text-muted-foreground")}>
                            {status === "done" && "Completed"}
                            {status === "partial" && `${formatMinutes(used)} of ${formatMinutes(item.duration_minutes)} logged`}
                            {status === "missed" && "Not logged"}
                            {status === "planned" && "Planned"}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {daySessions.length > 0 && (
                <div>
                  {dayPlanned.length > 0 && <h3 className="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed</h3>}
                  <ul className="divide-y divide-border/60">
                    {daySessions.map((s) => <SessionRow key={s.id} session={s} subjects={subjects} />)}
                  </ul>
                </div>
              )}

              {daySessions.length === 0 && dayPlanned.length === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  {selected > today ? "This day hasn't happened yet." : "Nothing logged for this day."}
                </p>
              )}
            </div>
          ) : (
            <p className="px-4 py-6 text-sm text-muted-foreground">Select a day to see its sessions.</p>
          )}
        </ScrollToDetail>
      </div>
    </PageContainer>
  );
}
