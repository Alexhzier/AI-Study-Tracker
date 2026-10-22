import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ArchiveButton } from "@/components/archive-button";
import { PageHeader } from "@/components/page-header";
import { SubjectDialog } from "@/components/subject-dialog";
import { Button } from "@/components/ui/button";
import { getSessionLite, getSubjects } from "@/lib/data/queries";
import { totalsBySubject } from "@/lib/stats";
import { formatMinutes } from "@/lib/time";
import type { Subject } from "@/lib/types";

export const metadata: Metadata = { title: "Subjects" };

export default async function SubjectsPage() {
  const [subjects, rows] = await Promise.all([getSubjects(), getSessionLite()]);
  const totals = totalsBySubject(rows);
  const active = subjects.filter((s) => !s.is_archived);
  const archived = subjects.filter((s) => s.is_archived);

  const Item = ({ s }: { s: Subject }) => {
    const t = totals.get(s.id) ?? { minutes: 0, count: 0 };
    return (
      <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${s.is_archived ? "text-muted-foreground" : ""}`}>{s.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatMinutes(t.minutes)} total · {t.count} {t.count === 1 ? "session" : "sessions"}
          </p>
        </div>
        <div className="flex items-center">
          <Button asChild variant="ghost" size="sm"><Link href={`/sessions?subject=${s.id}`}>View sessions</Link></Button>
          <SubjectDialog subject={s}><Button variant="ghost" size="sm">Edit</Button></SubjectDialog>
          <ArchiveButton id={s.id} archived={s.is_archived} />
        </div>
      </li>
    );
  };

  return (
    <>
      <PageHeader
        title="Subjects"
        description="Archiving a subject hides it from new sessions but keeps all its history."
        action={
          <SubjectDialog>
            <Button><Plus className="size-4" aria-hidden /> New subject</Button>
          </SubjectDialog>
        }
      />

      {subjects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No subjects yet. Create one for each course or topic you study.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <section aria-label="Active subjects">
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">All your subjects are archived. Create a new one or restore one below.</p>
            ) : (
              <ul className="divide-y rounded-lg border bg-card shadow-xs">{active.map((s) => <Item key={s.id} s={s} />)}</ul>
            )}
          </section>
          {archived.length > 0 && (
            <section aria-labelledby="arch-h">
              <h2 id="arch-h" className="mb-2 text-sm font-semibold text-muted-foreground">Archived</h2>
              <ul className="divide-y rounded-lg border bg-card shadow-xs">{archived.map((s) => <Item key={s.id} s={s} />)}</ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
