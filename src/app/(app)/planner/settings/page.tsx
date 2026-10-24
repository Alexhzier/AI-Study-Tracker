import type { Metadata } from "next";
import Link from "next/link";
import { ExamsManager } from "@/components/exams-manager";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { PlannerSettingsForm } from "@/components/planner-settings-form";
import { getExams, getPlannerSettings } from "@/lib/data/planner";
import { getSubjects } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Planner settings" };

export default async function PlannerSettingsPage() {
  const [subjects, settings, exams] = await Promise.all([getSubjects(), getPlannerSettings(), getExams()]);
  const active = subjects.filter((s) => !s.is_archived);

  return (
    <PageContainer size="narrow">
      <PageHeader
        title="Planner settings"
        description="The planner only uses what you enter here and what you've logged. It never guesses exam dates."
        action={<Link href="/planner" className="text-sm text-muted-foreground underline-offset-4 hover:underline">Back to planner</Link>}
      />
      <div className="space-y-10">
        <PlannerSettingsForm
          weeklyGoalMinutes={settings.weeklyGoalMinutes}
          availability={settings.availability}
          subjects={active.map((s) => ({ id: s.id, name: s.name, color: s.color, priority: settings.priorities[s.id] ?? 3 }))}
        />
        <section aria-labelledby="exams-h" className="space-y-3">
          <h2 id="exams-h" className="text-sm font-semibold">Upcoming exams</h2>
          <ExamsManager exams={exams} subjects={subjects} />
        </section>
      </div>
    </PageContainer>
  );
}
