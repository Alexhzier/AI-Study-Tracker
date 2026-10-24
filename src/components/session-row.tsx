import { format, parseISO } from "date-fns";
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
  const meta = [showDate ? format(parseISO(session.session_date), "MMM d") : null, times].filter(Boolean).join(" · ");

  return (
    <li className="group flex items-center gap-3 px-4 py-2.5">
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject?.color ?? "#999" }} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-medium">{subject?.name ?? "Unknown subject"}</p>
          {meta && <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>}
        </div>
        {session.notes && <p className="truncate text-xs text-muted-foreground">{session.notes}</p>}
      </div>
      <p className="w-16 shrink-0 text-right text-sm tabular-nums">{formatMinutes(session.duration_minutes)}</p>
      <div className="flex shrink-0 gap-0.5 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <SessionDialog subjects={subjects} session={session}>
          <Button variant="ghost" size="icon" aria-label="Edit session" className="size-8 text-muted-foreground">
            <Pencil className="size-3.5" aria-hidden />
          </Button>
        </SessionDialog>
        <DeleteSessionButton id={session.id} />
      </div>
    </li>
  );
}
