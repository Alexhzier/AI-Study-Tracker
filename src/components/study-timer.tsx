"use client";

import { Pause, Play, Square } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveTimerSession } from "@/actions/timer";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/lib/time";
import type { Subject } from "@/lib/types";
import { fieldClass, textareaClass } from "@/lib/ui";

const KEY = "study-tracker:timer:v1";

/**
 * Everything is derived from wall-clock timestamps, so a refresh, a closed tab or a
 * throttled background tab can't lose or distort time.
 */
type TimerState = {
  subjectId: string;
  status: "running" | "paused" | "stopped";
  startedAt: number; // ms, when the timer first started
  accumulatedMs: number; // active time from completed segments
  segmentStart: number | null; // ms, start of the current running segment
  endedAt: number | null; // ms, set when stopped
};

function read(): TimerState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const ok =
      typeof s?.subjectId === "string" &&
      ["running", "paused", "stopped"].includes(s.status) &&
      Number.isFinite(s.startedAt) &&
      Number.isFinite(s.accumulatedMs);
    return ok ? (s as TimerState) : null;
  } catch {
    return null;
  }
}

function write(s: TimerState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: timer still works until refresh */
  }
}

const elapsedMs = (s: TimerState, now: number) =>
  s.accumulatedMs + (s.status === "running" && s.segmentStart ? Math.max(0, now - s.segmentStart) : 0);

function clock(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

export function StudyTimer({ subjects }: { subjects: Subject[] }) {
  const [state, setState] = useState<TimerState | null>(null);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Restore after mount (localStorage isn't available during server render) and sync across tabs.
  useEffect(() => {
    setState(read());
    setNow(Date.now());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (state?.status !== "running") return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state?.status]);

  const commit = (s: TimerState | null) => {
    write(s);
    setState(s);
  };

  if (!ready) return <div className="mb-6 h-[4.5rem] rounded-lg border bg-card shadow-xs" aria-hidden />;

  const shell = "mb-6 rounded-lg border bg-card p-4 shadow-xs";

  // ---- idle
  if (!state) {
    if (subjects.length === 0) {
      return (
        <section aria-label="Study timer" className={shell}>
          <p className="text-sm text-muted-foreground">
            <Link href="/subjects" className="font-medium text-foreground underline underline-offset-4">Add a subject</Link>{" "}
            to start the study timer.
          </p>
        </section>
      );
    }
    return (
      <section aria-label="Study timer" className={`${shell} flex flex-wrap items-center gap-3`}>
        <div className="min-w-48 flex-1">
          <label htmlFor="timer-subject" className="sr-only">Subject</label>
          <select id="timer-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={fieldClass}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <Button
          onClick={() => {
            const t = Date.now();
            setNow(t);
            commit({ subjectId, status: "running", startedAt: t, accumulatedMs: 0, segmentStart: t, endedAt: null });
          }}
        >
          <Play className="size-4" aria-hidden /> Start timer
        </Button>
      </section>
    );
  }

  const subject = subjects.find((s) => s.id === state.subjectId);
  const ms = elapsedMs(state, now);

  // ---- stopped: review and save
  if (state.status === "stopped") {
    const minutes = Math.round(state.accumulatedMs / 60000);
    return (
      <section aria-label="Save study session" className={`${shell} space-y-3`}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">
            <span className="mr-2 inline-block size-2.5 rounded-full align-middle" style={{ backgroundColor: subject?.color ?? "#999" }} aria-hidden />
            {subject?.name ?? "Unknown subject"}
          </p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {minutes >= 1 ? `${formatMinutes(minutes)} studied` : "Less than a minute"}
          </p>
        </div>
        <textarea aria-label="Session notes" placeholder="Notes (optional)" rows={2} maxLength={2000}
          value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaClass} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost" disabled={pending}
            onClick={() => {
              if (!confirm("Discard this session? The time won't be saved.")) return;
              setError(null);
              setNotes("");
              commit(null);
            }}
          >
            Discard
          </Button>
          <Button
            disabled={pending || minutes < 1}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const res = await saveTimerSession({
                  subject_id: state.subjectId,
                  started_at: state.startedAt,
                  ended_at: state.endedAt ?? Date.now(),
                  duration_minutes: minutes,
                  notes: notes.trim() || undefined,
                });
                if (res.error) return setError(res.error);
                toast.success("Session saved");
                setNotes("");
                commit(null);
              });
            }}
          >
            {pending ? "Saving…" : "Save session"}
          </Button>
        </div>
      </section>
    );
  }

  // ---- running / paused
  const running = state.status === "running";
  return (
    <section aria-label="Study timer" className={`${shell} flex flex-wrap items-center gap-x-6 gap-y-3`}>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject?.color ?? "#999" }} aria-hidden />
          <span className="truncate">{subject?.name ?? "Unknown subject"}</span>
          <span aria-live="polite">· {running ? "Running" : "Paused"}</span>
        </p>
        <p role="timer" className={`mt-0.5 text-3xl font-semibold tabular-nums tracking-tight ${running ? "" : "text-muted-foreground"}`}>
          {clock(ms)}
        </p>
      </div>
      <div className="flex gap-2">
        {running ? (
          <Button variant="outline" onClick={() => { const t = Date.now(); commit({ ...state, status: "paused", accumulatedMs: elapsedMs(state, t), segmentStart: null }); }}>
            <Pause className="size-4" aria-hidden /> Pause
          </Button>
        ) : (
          <Button onClick={() => { const t = Date.now(); setNow(t); commit({ ...state, status: "running", segmentStart: t }); }}>
            <Play className="size-4" aria-hidden /> Resume
          </Button>
        )}
        <Button variant="secondary" onClick={() => { const t = Date.now(); commit({ ...state, status: "stopped", accumulatedMs: elapsedMs(state, t), segmentStart: null, endedAt: t }); }}>
          <Square className="size-4" aria-hidden /> Stop
        </Button>
      </div>
    </section>
  );
}
