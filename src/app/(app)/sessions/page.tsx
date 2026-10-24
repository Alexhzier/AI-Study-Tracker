import type { Metadata } from "next";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SessionDialog } from "@/components/session-dialog";
import { SessionRow } from "@/components/session-row";
import { SubjectFilter } from "@/components/subject-filter";
import { Button } from "@/components/ui/button";
import { getSubjects, listSessions } from "@/lib/data/queries";
import { formatMinutes, todayISO } from "@/lib/time";
import type { Session } from "@/lib/types";

export const metadata: Metadata = { title: "Sessions" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SessionsPage({
  searchParams,
}: { searchParams: Promise<{ subject?: string; limit?: string }> }) {
  const sp = await searchParams;
  const subjectId = sp.subject && UUID.test(sp.subject) ? sp.subject : undefined;
  const limit = Math.min(Math.max(Number(sp.limit) || 100, 100), 2000);

  const [subjects, sessions] = await Promise.all([getSubjects(), listSessions({ subjectId, limit })]);

  const today = todayISO();
  const yesterday = format(addDays(parseISO(today), -1), "yyyy-MM-dd");
  const dayName = (d: string) => (d === today ? "Today" : d === yesterday ? "Yesterday" : format(parseISO(d), "EEEE"));
  const dayDate = (d: string) => format(parseISO(d), d.slice(0, 4) === today.slice(0, 4) ? "MMM d" : "MMM d, yyyy");

  const groups = new Map<string, Session[]>();
  for (const s of sessions) groups.set(s.session_date, [...(groups.get(s.session_date) ?? []), s]);

  const more = `/sessions?${new URLSearchParams({ ...(subjectId ? { subject: subjectId } : {}), limit: String(limit + 100) })}`;

  return (
    <PageContainer size="content">
      <PageHeader
        title="Sessions"
        action={
          <>
            <SubjectFilter subjects={subjects} value={subjectId} />
            <SessionDialog subjects={subjects}>
              <Button><Plus className="size-4" aria-hidden /> Log session</Button>
            </SessionDialog>
          </>
        }
      />

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {subjectId ? "No sessions for this subject yet." : "No sessions logged yet. Use “Log session” to add your first one."}
          </p>
        </div>
      ) : (
        <div className="relative space-y-6 md:space-y-8 md:before:absolute md:before:inset-y-1 md:before:left-[8.75rem] md:before:w-px md:before:bg-border">
          {[...groups.entries()].map(([date, list]) => (
            <section key={date} aria-label={`${dayName(date)}, ${dayDate(date)}`} className="md:grid md:grid-cols-[8rem_minmax(0,1fr)] md:gap-6">
              <div className="relative mb-2 flex items-baseline justify-between md:mb-0 md:block md:pt-0.5">
                <div>
                  <h2 className="text-sm font-semibold">{dayName(date)}</h2>
                  <p className="text-xs text-muted-foreground">{dayDate(date)}</p>
                </div>
                <p className="text-sm tabular-nums text-muted-foreground md:mt-2">
                  {formatMinutes(list.reduce((n, s) => n + s.duration_minutes, 0))}
                </p>
                <span aria-hidden className="absolute left-[8.5rem] top-2 hidden size-2 rounded-full bg-primary md:block" />
              </div>
              <Panel>
                <ul className="divide-y">
                  {list.map((s) => <SessionRow key={s.id} session={s} subjects={subjects} />)}
                </ul>
              </Panel>
            </section>
          ))}
          {sessions.length >= limit && (
            <div className="text-center md:pl-[9rem]">
              <Button asChild variant="outline"><Link href={more}>Show more</Link></Button>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
