import type { Metadata } from "next";
import Link from "next/link";
import { addDays, addWeeks, differenceInCalendarDays, format, parseISO } from "date-fns";
import { Settings } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { PlannerExplainer } from "@/components/planner-explainer";
import { PlannerInputs } from "@/components/planner-inputs";
import { PlannerWorkspace, type WeekOption } from "@/components/planner-workspace";
import { SamplePlanCard } from "@/components/sample-plan-card";
import { Button } from "@/components/ui/button";
import { aiConfig } from "@/lib/ai/config";
import { remainingGenerations } from "@/lib/ai/usage";
import { weekStartISO } from "@/lib/analytics";
import { getApprovedPlans, getExams, getPlannerSettings } from "@/lib/data/planner";
import { getSubjects } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/time";

export const metadata: Metadata = { title: "Planner" };
export const maxDuration = 60; // AI generation can take a while

const range = (start: string) => {
  const s = parseISO(start);
  return `${format(s, "MMM d")} – ${format(addDays(s, 6), "MMM d")}`;
};

export default async function PlannerPage() {
  const cfg = aiConfig();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isGuest = Boolean(user?.is_anonymous);

  const today = todayISO();
  const thisWeek = weekStartISO(today);
  const nextWeek = format(addWeeks(parseISO(thisWeek), 1), "yyyy-MM-dd");

  const [subjects, settings, plans, remaining, exams] = await Promise.all([
    getSubjects(),
    getPlannerSettings(),
    getApprovedPlans([thisWeek, nextWeek]),
    cfg.enabled ? remainingGenerations(supabase, cfg, isGuest) : Promise.resolve(0),
    getExams(),
  ]);

  const active = subjects.filter((s) => !s.is_archived);
  const weeks: WeekOption[] = [
    { key: "this", weekStart: thisWeek, name: "This week", range: range(thisWeek), approved: plans[thisWeek] ?? null },
    { key: "next", weekStart: nextWeek, name: "Next week", range: range(nextWeek), approved: plans[nextWeek] ?? null },
  ];
  const hasApproved = weeks.some((w) => w.approved);

  const upcomingExams = exams
    .filter((e) => e.exam_date >= today)
    .map((e) => ({ e, s: active.find((x) => x.id === e.subject_id) }))
    .filter((x) => x.s)
    .slice(0, 4)
    .map(({ e, s }) => ({
      id: e.id, title: e.title, subject: s!.name, color: s!.color, date: e.exam_date,
      daysUntil: differenceInCalendarDays(parseISO(e.exam_date), parseISO(today)),
    }));

  return (
    <PageContainer size="default">
      <PageHeader
        title="Study planner"
        description="A weekly plan drafted from your goals, availability, exams and study history. You review it before it reaches your calendar."
        action={
          <Button asChild variant="outline">
            <Link href="/planner/settings"><Settings className="size-4" aria-hidden /> Settings</Link>
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          {(isGuest || !cfg.enabled) && <PlannerExplainer isGuest={isGuest} />}
          <PlannerWorkspace
            subjects={active}
            weeks={weeks}
            enabled={cfg.enabled}
            remaining={remaining}
            limit={isGuest ? cfg.guestLimit : cfg.dailyLimit}
            hasAvailability={Object.keys(settings.availability).length > 0}
            userId={user?.id ?? "anonymous"}
          />
          {!cfg.enabled && !hasApproved && <SamplePlanCard />}
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <PlannerInputs
            goalMinutes={settings.weeklyGoalMinutes}
            availability={settings.availability}
            subjects={active.map((s) => ({ id: s.id, name: s.name, color: s.color, priority: settings.priorities[s.id] ?? 3 }))}
            exams={upcomingExams}
          />
        </div>
      </div>
    </PageContainer>
  );
}
