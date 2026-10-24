import type { Metadata } from "next";
import Link from "next/link";
import { addDays, addWeeks, format, parseISO } from "date-fns";
import { Settings } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { PlannerWorkspace, type WeekOption } from "@/components/planner-workspace";
import { Button } from "@/components/ui/button";
import { aiConfig } from "@/lib/ai/config";
import { remainingGenerations } from "@/lib/ai/usage";
import { weekStartISO } from "@/lib/analytics";
import { getPlannerSettings, getApprovedPlans } from "@/lib/data/planner";
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
  const thisWeek = weekStartISO(todayISO());
  const nextWeek = format(addWeeks(parseISO(thisWeek), 1), "yyyy-MM-dd");

  const [subjects, settings, plans, remaining] = await Promise.all([
    getSubjects(),
    getPlannerSettings(),
    getApprovedPlans([thisWeek, nextWeek]),
    cfg.enabled ? remainingGenerations(supabase, cfg, isGuest) : Promise.resolve(0),
  ]);

  const weeks: WeekOption[] = [
    { key: "this", weekStart: thisWeek, label: `This week (${range(thisWeek)})`, approved: plans[thisWeek] ?? null },
    { key: "next", weekStart: nextWeek, label: `Next week (${range(nextWeek)})`, approved: plans[nextWeek] ?? null },
  ];

  return (
    <PageContainer size="default">
      <PageHeader
        title="Study planner"
        description="Generate a weekly plan from your goals, availability, exams and study history, then review it before it goes on your calendar."
        action={
          <Button asChild variant="outline">
            <Link href="/planner/settings"><Settings className="size-4" aria-hidden /> Planner settings</Link>
          </Button>
        }
      />
      <PlannerWorkspace
        subjects={subjects.filter((s) => !s.is_archived)}
        weeks={weeks}
        enabled={cfg.enabled}
        remaining={remaining}
        limit={isGuest ? cfg.guestLimit : cfg.dailyLimit}
        hasAvailability={Object.keys(settings.availability).length > 0}
        userId={user?.id ?? "anonymous"}
      />
    </PageContainer>
  );
}
