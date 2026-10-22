import type { Metadata } from "next";
import Link from "next/link";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isValid, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SessionDialog } from "@/components/session-dialog";
import { SessionRow } from "@/components/session-row";
import { Button } from "@/components/ui/button";
import { getSubjects, listSessions } from "@/lib/data/queries";
import { heatLevel } from "@/lib/stats";
import { formatHoursShort, formatMinutes, todayISO } from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar" };

const HEAT = [
  "bg-card hover:bg-secondary",
  "bg-heat-1 text-foreground",
  "bg-heat-2 text-foreground",
  "bg-heat-3 text-foreground",
  "bg-heat-4 text-[#10181a]",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  const [subjects, sessions] = await Promise.all([getSubjects(), listSessions({ from, to })]);

  const byDay = new Map<string, number>();
  for (const s of sessions) byDay.set(s.session_date, (byDay.get(s.session_date) ?? 0) + s.duration_minutes);
  const monthTotal = [...byDay.values()].reduce((a, b) => a + b, 0);

  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(monthStart) });
  const offset = (getDay(monthStart) + 6) % 7; // Monday-first grid
  const href = (m: string, d?: string) => `/calendar?month=${m}${d ? `&date=${d}` : ""}`;
  const selectedSessions = selected ? sessions.filter((s) => s.session_date === selected) : [];
  const selectedTotal = selectedSessions.reduce((n, s) => n + s.duration_minutes, 0);

  return (
    <>
      <PageHeader title="Calendar" description={`${formatMinutes(monthTotal)} studied in ${format(monthStart, "MMMM yyyy")}`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_21rem]">
        <section aria-label="Month view">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">{format(monthStart, "MMMM yyyy")}</h2>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon" aria-label="Previous month">
                <Link href={href(format(addMonths(monthStart, -1), "yyyy-MM"))}><ChevronLeft className="size-4" aria-hidden /></Link>
              </Button>
              <Button asChild variant="outline" size="sm"><Link href={href(today.slice(0, 7), today)}>Today</Link></Button>
              <Button asChild variant="ghost" size="icon" aria-label="Next month">
                <Link href={href(format(addMonths(monthStart, 1), "yyyy-MM"))}><ChevronRight className="size-4" aria-hidden /></Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="pb-1 text-center text-xs text-muted-foreground">{w}</div>
            ))}
            {Array.from({ length: offset }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const minutes = byDay.get(iso) ?? 0;
              const isToday = iso === today;
              return (
                <Link
                  key={iso} href={href(month, iso)} scroll={false}
                  aria-label={`${format(day, "MMMM d")}: ${minutes ? formatMinutes(minutes) : "no study"}`}
                  aria-current={iso === selected ? "date" : undefined}
                  className={cn(
                    "flex aspect-square flex-col justify-between rounded-md border p-1.5 text-xs transition-colors sm:aspect-[5/4]",
                    HEAT[heatLevel(minutes)],
                    iso === selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                  )}
                >
                  <span className={cn("tabular-nums", isToday && "font-semibold underline underline-offset-2")}>{format(day, "d")}</span>
                  {minutes > 0 && <span className="tabular-nums font-medium">{formatHoursShort(minutes)}</span>}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-end gap-1.5 text-xs text-muted-foreground" aria-hidden>
            Less
            {HEAT.map((c, i) => <span key={i} className={cn("size-3.5 rounded-sm border", c.split(" ")[0])} />)}
            More
          </div>
        </section>

        <aside aria-label="Selected day" className="h-fit rounded-lg border bg-card shadow-xs">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold">{format(parseISO(selected), "EEEE, MMM d")}</h2>
                  <p className="text-xs text-muted-foreground">{selectedTotal ? `${formatMinutes(selectedTotal)} studied` : "No study time"}</p>
                </div>
                {selected <= today && (
                  <SessionDialog subjects={subjects} defaultDate={selected}>
                    <Button size="sm"><Plus className="size-4" aria-hidden /> Add</Button>
                  </SessionDialog>
                )}
              </div>
              {selectedSessions.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {selected > today ? "This day hasn't happened yet." : "Nothing logged for this day."}
                </p>
              ) : (
                <ul className="divide-y">
                  {selectedSessions.map((s) => <SessionRow key={s.id} session={s} subjects={subjects} />)}
                </ul>
              )}
            </>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Select a day to see its sessions.</p>
          )}
        </aside>
      </div>
    </>
  );
}
