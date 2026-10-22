import { Pencil } from "lucide-react";
import { DeleteSessionButton } from "@/components/delete-session-button";
import { SessionDialog } from "@/components/session-dialog";
import { Button } from "@/components/ui/button";
import { formatMinutes, toLocalTime } from "@/lib/time";
import type { Session, Subject } from "@/lib/types";

export function SessionRow({
  session, subjects, showDate,
}: { session: Session; subjects: Subject[]; showDate?: boolean }) {
  const subject = subjects.find((s) => s.id === session.subject_id);
  const times =
    session.started_at && session.ended_at
      ? `${toLocalTime(session.started_at)}–${toLocalTime(session.ended_at)}`
      : null;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject?.color ?? "#999" }} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{subject?.name ?? "Unknown subject"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[showDate ? session.session_date : null, times, session.notes].filter(Boolean).join(" · ") || "No details"}
        </p>
      </div>
      <p className="shrink-0 text-sm tabular-nums">{formatMinutes(session.duration_minutes)}</p>
      <div className="flex shrink-0">
        <SessionDialog subjects={subjects} session={session}>
          <Button variant="ghost" size="icon" aria-label="Edit session" className="text-muted-foreground">
            <Pencil className="size-4" aria-hidden />
          </Button>
        </SessionDialog>
        <DeleteSessionButton id={session.id} />
      </div>
    </li>
  );
}
