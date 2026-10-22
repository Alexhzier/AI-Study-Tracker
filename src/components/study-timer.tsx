"use client";

import { Pause, Play, Square } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { timerDiscard, timerPause, timerResume, timerSave, timerStart, timerStop } from "@/actions/timer";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { elapsedMs, normalizeTimer, type TimerResult, type TimerRow } from "@/lib/timer";
import { formatMinutes } from "@/lib/time";
import type { Subject } from "@/lib/types";
import { fieldClass, textareaClass } from "@/lib/ui";

function clock(ms: number) {
  const total = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(total / 3600))}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`;
}

/**
 * The timer lives in the database. This component shows it, ticks locally using the server's
 * clock offset, and stays in sync via Realtime plus a light poll as a fallback.
 */
export function StudyTimer({ subjects, userId }: { subjects: Subject[]; userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const active = subjects.filter((s) => !s.is_archived);

  const [timer, setTimer] = useState<TimerRow | null>(null);
  const [offset, setOffset] = useState(0); // server clock minus client clock, in ms
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [now, setNow] = useState(0);
  const [subjectId, setSubjectId] = useState(active[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase.rpc("timer_state");
    if (err || !data) {
      setLoadError(true);
      setReady(true);
      return;
    }
    setLoadError(false);
    setTimer(normalizeTimer(data.timer));
    setOffset(Number(data.server_now) - Date.now());
    setNow(Date.now());
    setReady(true);
  }, [supabase]);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel(`active_timer:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "active_timers", filter: `user_id=eq.${userId}` },
        (payload) => setTimer(payload.eventType === "DELETE" ? null : normalizeTimer(payload.new)),
      )
      .subscribe();

    const onVisible = () => document.visibilityState === "visible" && refresh();
    const poll = setInterval(onVisible, 20_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [supabase, userId, refresh]);

  useEffect(() => {
    if (timer?.status !== "running") return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer?.status]);

  function act(fn: () => Promise<TimerResult>, onOk?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) {
        setError(res.error);
        await refresh(); // another device may have changed things
        return;
      }
      setTimer(res.timer ?? null);
      if (res.serverNow) setOffset(res.serverNow - Date.now());
      setNow(Date.now());
      onOk?.();
    });
  }

  const shell = "mb-6 rounded-lg border bg-card p-4 shadow-xs";

  if (!ready) return <div className="mb-6 h-[4.5rem] rounded-lg border bg-card shadow-xs" aria-hidden />;

  if (loadError && !timer) {
    return (
      <section aria-label="Study timer" className={`${shell} flex flex-wrap items-center justify-between gap-3`}>
        <p className="text-sm text-muted-foreground">Couldn&rsquo;t load the timer. Check your connection, and that the latest database update has been applied.</p>
        <Button variant="outline" size="sm" onClick={refresh}>Retry</Button>
      </section>
    );
  }

  // ---- idle
  if (!timer) {
    if (active.length === 0) {
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
      <section aria-label="Study timer" className={shell}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-48 flex-1">
            <label htmlFor="timer-subject" className="sr-only">Subject</label>
            <select id="timer-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={fieldClass}>
              {active.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Button disabled={pending || !subjectId} onClick={() => act(() => timerStart(subjectId))}>
            <Play className="size-4" aria-hidden /> Start timer
          </Button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </section>
    );
  }

  const subject = subjects.find((s) => s.id === timer.subject_id);
  const dot = (
    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject?.color ?? "#999" }} aria-hidden />
  );

  // ---- stopped: review and save (from any device)
  if (timer.status === "stopped") {
    const minutes = Math.round(timer.accumulated_ms / 60000);
    return (
      <section aria-label="Save study session" className={`${shell} space-y-3`}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium">{dot}{subject?.name ?? "Unknown subject"}</p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {minutes >= 1 ? `${formatMinutes(minutes)} studied` : "Less than a minute"}
          </p>
        </div>
        <textarea aria-label="Session notes" placeholder="Notes (optional)" rows={2} maxLength={2000}
          value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaClass} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" disabled={pending}
            onClick={() => {
              if (!confirm("Discard this session? The time won't be saved.")) return;
              act(() => timerDiscard(), () => setNotes(""));
            }}>
            Discard
          </Button>
          <Button disabled={pending || minutes < 1}
            onClick={() => act(() => timerSave(notes.trim() || undefined), () => { toast.success("Session saved"); setNotes(""); })}>
            {pending ? "Saving…" : "Save session"}
          </Button>
        </div>
      </section>
    );
  }

  // ---- running / paused
  const running = timer.status === "running";
  const ms = elapsedMs(timer, now + offset);
  return (
    <section aria-label="Study timer" className={shell}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {dot}
            <span className="truncate">{subject?.name ?? "Unknown subject"}</span>
            <span aria-live="polite">· {running ? "Running" : "Paused"}</span>
          </p>
          <p role="timer" className={`mt-0.5 text-3xl font-semibold tabular-nums tracking-tight ${running ? "" : "text-muted-foreground"}`}>
            {clock(ms)}
          </p>
        </div>
        <div className="flex gap-2">
          {running ? (
            <Button variant="outline" disabled={pending} onClick={() => act(() => timerPause())}>
              <Pause className="size-4" aria-hidden /> Pause
            </Button>
          ) : (
            <Button disabled={pending} onClick={() => act(() => timerResume())}>
              <Play className="size-4" aria-hidden /> Resume
            </Button>
          )}
          <Button variant="secondary" disabled={pending} onClick={() => act(() => timerStop())}>
            <Square className="size-4" aria-hidden /> Stop
          </Button>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
