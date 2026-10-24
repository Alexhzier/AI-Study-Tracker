import type { Metadata } from "next";
import Link from "next/link";
import { addDays, addWeeks, format, isValid, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HoursBarChart, SubjectPie } from "@/components/charts";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Panel, PanelHeader } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { dailyForWeek, recentMonths, recentWeeks, subjectDistribution, weekStartISO } from "@/lib/analytics";
import { getPlannerSettings } from "@/lib/data/planner";
import { getSessionLite, getSubjects } from "@/lib/data/queries";
import { computeInsights } from "@/lib/insights";
import { formatMinutes, todayISO } from "@/lib/time";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const sp = await searchParams;
  const today = todayISO();
  const parsed = sp.week ? parseISO(sp.week) : null;
  const ref = parsed && isValid(parsed) && format(parsed, "yyyy-MM-dd") === sp.week ? sp.week : today;

  const [subjects, rows, planner] = await Promise.all([getSubjects(), getSessionLite(), getPlannerSettings()]);

  if (rows.length === 0) {
    return (
      <PageContainer size="wide">
        <PageHeader title="Analytics" />
        <div className="rounded-lg border border-dashed px-6 py-14 text-center">
          <h2 className="text-sm font-semibold">No data to chart yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Log a study session and your charts and observations will appear here.</p>
        </div>
      </PageContainer>
    );
  }

  const weekStart = weekStartISO(ref);
  const currentWeek = weekStartISO(today);
  const start = parseISO(weekStart);
  const daily = dailyForWeek(rows, weekStart, today);
  const weekTotal = daily.reduce((n, d) => n + d.minutes, 0);
  const prev = format(addWeeks(start, -1), "yyyy-MM-dd");
  const next = format(addWeeks(start, 1), "yyyy-MM-dd");
  const insights = computeInsights(rows, subjects, planner.weeklyGoalMinutes, today);

  return (
    <PageContainer size="wide">
      <PageHeader title="Analytics" description="Weeks run Monday to Sunday." />

      {insights.length > 0 && (
        <Panel aria-labelledby="insights-h" className="mb-4">
          <PanelHeader id="insights-h" title="At a glance" />
          <ul className="grid gap-x-10 gap-y-3 p-4 md:grid-cols-2">
            {insights.map((i) => (
              <li key={i.id} className="text-sm leading-relaxed text-muted-foreground">
                <strong className="font-semibold text-foreground">{i.lead}</strong>
                {i.rest}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel aria-labelledby="daily-h">
          <PanelHeader
            id="daily-h" title="Daily hours"
            action={
              <div className="flex items-center gap-1">
                <span className="mr-1 text-xs text-muted-foreground">{format(start, "MMM d")} – {format(addDays(start, 6), "MMM d")}</span>
                <Button asChild variant="ghost" size="icon" aria-label="Previous week" className="size-8">
                  <Link href={`/analytics?week=${prev}`}><ChevronLeft className="size-4" aria-hidden /></Link>
                </Button>
                {weekStart !== currentWeek ? (
                  <Button asChild variant="ghost" size="icon" aria-label="Next week" className="size-8">
                    <Link href={`/analytics?week=${next}`}><ChevronRight className="size-4" aria-hidden /></Link>
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" aria-label="Next week" disabled className="size-8"><ChevronRight className="size-4" aria-hidden /></Button>
                )}
              </div>
            }
          />
          <div className="p-4">
            <HoursBarChart data={daily} label="Daily study time for the selected week" />
          </div>
          <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">Week total: {formatMinutes(weekTotal)}</p>
        </Panel>

        <Panel aria-labelledby="weekly-h">
          <PanelHeader id="weekly-h" title="Weekly hours" action={<span className="text-xs text-muted-foreground">Last 12 weeks</span>} />
          <div className="p-4"><HoursBarChart data={recentWeeks(rows, today)} label="Weekly study time for the last 12 weeks" /></div>
        </Panel>

        <Panel aria-labelledby="subject-h">
          <PanelHeader id="subject-h" title="Time by subject" action={<span className="text-xs text-muted-foreground">All time</span>} />
          <div className="p-4"><SubjectPie data={subjectDistribution(rows, subjects)} /></div>
        </Panel>

        <Panel aria-labelledby="monthly-h">
          <PanelHeader id="monthly-h" title="Monthly hours" action={<span className="text-xs text-muted-foreground">Last 12 months</span>} />
          <div className="p-4"><HoursBarChart data={recentMonths(rows, today)} label="Study time by month for the last 12 months" /></div>
        </Panel>
      </div>
    </PageContainer>
  );
}
