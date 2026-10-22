import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SessionDialog } from "@/components/session-dialog";
import { SessionRow } from "@/components/session-row";
import { SubjectFilter } from "@/components/subject-filter";
import { Button } from "@/components/ui/button";
import { getSubjects, listSessions } from "@/lib/data/queries";
import { formatMinutes } from "@/lib/time";
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

  const groups = new Map<string, Session[]>();
  for (const s of sessions) groups.set(s.session_date, [...(groups.get(s.session_date) ?? []), s]);

  const more = `/sessions?${new URLSearchParams({ ...(subjectId ? { subject: subjectId } : {}), limit: String(limit + 100) })}`;

  return (
    <>
      <PageHeader
        title="Sessions"
        action={
          <div className="flex items-center gap-2">
            <SubjectFilter subjects={subjects} value={subjectId} />
            <SessionDialog subjects={subjects}>
              <Button><Plus className="size-4" aria-hidden /> Log session</Button>
            </SessionDialog>
          </div>
        }
      />

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {subjectId ? "No sessions for this subject yet." : "No sessions logged yet. Use “Log session” to add your first one."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([date, list]) => (
            <section key={date} aria-label={date}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-sm font-semibold">{format(parseISO(date), "EEE, MMM d, yyyy")}</h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatMinutes(list.reduce((n, s) => n + s.duration_minutes, 0))}
                </span>
              </div>
              <ul className="divide-y rounded-lg border bg-card shadow-xs">
                {list.map((s) => <SessionRow key={s.id} session={s} subjects={subjects} />)}
              </ul>
            </section>
          ))}
          {sessions.length >= limit && (
            <div className="text-center">
              <Button asChild variant="outline"><Link href={more}>Show more</Link></Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
