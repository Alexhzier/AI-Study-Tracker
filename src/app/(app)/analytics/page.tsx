import type { Metadata } from "next";
import Link from "next/link";
import { addDays, addWeeks, format, isValid, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HoursBarChart, SubjectPie } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { dailyForWeek, recentMonths, recentWeeks, subjectDistribution, weekStartISO } from "@/lib/analytics";
import { getSessionLite, getSubjects } from "@/lib/data/queries";
import { formatMinutes, todayISO } from "@/lib/time";

export const metadata: Metadata = { title: "Analytics" };

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const sp = await searchParams;
  const today = todayISO();
  const parsed = sp.week ? parseISO(sp.week) : null;
  const ref = parsed && isValid(parsed) && format(parsed, "yyyy-MM-dd") === sp.week ? sp.week : today;

  const [subjects, rows] = await Promise.all([getSubjects(), getSessionLite()]);

  if (rows.length === 0) {
    return (
      <>
        <PageHeader title="Analytics" />
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">Charts appear after you log your first session.</p>
        </div>
      </>
    );
  }

  const weekStart = weekStartISO(ref);
  const currentWeek = weekStartISO(today);
  const start = parseISO(weekStart);
  const daily = dailyForWeek(rows, weekStart);
  const weekTotal = daily.reduce((n, d) => n + d.hours, 0);
  const prev = format(addWeeks(start, -1), "yyyy-MM-dd");
  const next = format(addWeeks(start, 1), "yyyy-MM-dd");

  return (
    <>
      <PageHeader title="Analytics" description="Weeks run Monday to Sunday." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title={`Daily hours · ${format(start, "MMM d")} – ${format(addDays(start, 6), "MMM d")}`}
          aside={
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon" aria-label="Previous week">
                <Link href={`/analytics?week=${prev}`}><ChevronLeft className="size-4" aria-hidden /></Link>
              </Button>
              {weekStart !== currentWeek ? (
                <Button asChild variant="ghost" size="icon" aria-label="Next week">
                  <Link href={`/analytics?week=${next}`}><ChevronRight className="size-4" aria-hidden /></Link>
                </Button>
              ) : (
                <Button variant="ghost" size="icon" aria-label="Next week" disabled><ChevronRight className="size-4" aria-hidden /></Button>
              )}
            </div>
          }
        >
          <HoursBarChart data={daily} label="Daily study hours for the selected week" />
          <p className="mt-2 text-xs text-muted-foreground">Week total: {formatMinutes(Math.round(weekTotal * 60))}</p>
        </Card>

        <Card title="Weekly hours · last 12 weeks">
          <HoursBarChart data={recentWeeks(rows, today)} label="Weekly study hours for the last 12 weeks" />
        </Card>

        <Card title="Time by subject · all time">
          <SubjectPie data={subjectDistribution(rows, subjects)} />
        </Card>

        <Card title="Hours by month · last 12 months">
          <HoursBarChart data={recentMonths(rows, today)} label="Total study hours by month" />
        </Card>
      </div>
    </>
  );
}
