"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSession } from "@/actions/sessions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatMinutes, toLocalTime, todayISO } from "@/lib/time";
import type { Session, Subject } from "@/lib/types";
import { fieldClass, textareaClass } from "@/lib/ui";

type Props = {
  subjects: Subject[];
  session?: Session;
  defaultDate?: string;
  children: React.ReactNode; // the trigger element
};

export function SessionDialog({ subjects, session, defaultDate, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{session ? "Edit session" : "Log a study session"}</DialogTitle>
          <DialogDescription>
            Enter start and end times, or just a duration.
          </DialogDescription>
        </DialogHeader>
        <SessionForm
          subjects={subjects}
          session={session}
          defaultDate={defaultDate}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function SessionForm({
  subjects, session, defaultDate, onDone,
}: Omit<Props, "children"> & { onDone: () => void }) {
  const options = subjects.filter((s) => !s.is_archived || s.id === session?.subject_id);
  const [start, setStart] = useState(session?.started_at ? toLocalTime(session.started_at) : "");
  const [end, setEnd] = useState(session?.ended_at ? toLocalTime(session.ended_at) : "");
  const [hours, setHours] = useState(session ? String(Math.floor(session.duration_minutes / 60)) : "");
  const [minutes, setMinutes] = useState(session ? String(session.duration_minutes % 60) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const calculated = useMemo(() => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  }, [start, end]);

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You need a subject before you can log a session.{" "}
        <Link href="/subjects" className="font-medium text-foreground underline underline-offset-4">
          Create one
        </Link>
        .
      </p>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (session) fd.set("id", session.id);
    setError(null);
    startTransition(async () => {
      const res = await saveSession(fd);
      if (res.error) return setError(res.error);
      toast.success(session ? "Session updated" : "Session logged");
      onDone();
    });
  }

  const lockDuration = calculated !== null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="subject_id" className="text-sm font-medium">Subject</label>
        <select id="subject_id" name="subject_id" required defaultValue={session?.subject_id ?? options[0].id} className={fieldClass}>
          {options.map((s) => (
            <option key={s.id} value={s.id}>{s.name}{s.is_archived ? " (archived)" : ""}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="session_date" className="text-sm font-medium">Date</label>
        <input id="session_date" name="session_date" type="date" required max={todayISO()}
          defaultValue={session?.session_date ?? defaultDate ?? todayISO()} className={fieldClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="start_time" className="text-sm font-medium">Start time <span className="font-normal text-muted-foreground">(optional)</span></label>
          <input id="start_time" name="start_time" type="time" value={start} onChange={(e) => setStart(e.target.value)} className={fieldClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="end_time" className="text-sm font-medium">End time <span className="font-normal text-muted-foreground">(optional)</span></label>
          <input id="end_time" name="end_time" type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={fieldClass} />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Duration</legend>
        <div className="flex flex-wrap gap-1.5">
          {[15, 30, 45, 60, 90, 120].map((m) => (
            <button
              key={m} type="button" disabled={lockDuration}
              onClick={() => { setHours(String(Math.floor(m / 60) || "")); setMinutes(String(m % 60 || "")); }}
              className="h-8 rounded-md border border-input px-2.5 text-xs transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {formatMinutes(m)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="hours" className="text-xs text-muted-foreground">Hours</label>
            <input id="hours" name="hours" type="number" min={0} max={24} inputMode="numeric" placeholder="0"
              disabled={lockDuration} value={hours} onChange={(e) => setHours(e.target.value)} className={fieldClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="minutes" className="text-xs text-muted-foreground">Minutes</label>
            <input id="minutes" name="minutes" type="number" min={0} max={59} inputMode="numeric" placeholder="0"
              disabled={lockDuration} value={minutes} onChange={(e) => setMinutes(e.target.value)} className={fieldClass} />
          </div>
        </div>
        {lockDuration && (
          <p className={`text-xs ${calculated! > 0 ? "text-muted-foreground" : "text-destructive"}`}>
            {calculated! > 0
              ? `Calculated from start and end: ${formatMinutes(calculated!)}`
              : "End time must be after start time."}
          </p>
        )}
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
        <textarea id="notes" name="notes" rows={3} maxLength={2000} defaultValue={session?.notes ?? ""} className={textareaClass} />
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : session ? "Save changes" : "Log session"}</Button>
      </div>
    </form>
  );
}
