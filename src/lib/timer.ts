export type TimerRow = {
  subject_id: string;
  status: "running" | "paused" | "stopped";
  started_at: string;
  segment_started_at: string | null;
  accumulated_ms: number;
  ended_at: string | null;
  mode?: "stopwatch" | "pomodoro";
  phase?: "focus" | "short_break" | "long_break";
  phase_started_at?: string | null;
  focus_duration_ms?: number | null;
  phase_duration_ms?: number | null;
  phase_accumulated_ms?: number;
  cycles_completed?: number;
  short_break_ms?: number;
  long_break_ms?: number;
  long_break_every?: number;
  objective?: string | null;
};

export type TimerResult = { error?: string; timer?: TimerRow | null; serverNow?: number };

/** Accepts a database row or a realtime payload and returns a clean TimerRow (or null). */
export function normalizeTimer(raw: unknown): TimerRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.subject_id !== "string" || !["running", "paused", "stopped"].includes(String(r.status))) return null;
  return {
    subject_id: r.subject_id,
    status: r.status as TimerRow["status"],
    started_at: String(r.started_at),
    segment_started_at: r.segment_started_at ? String(r.segment_started_at) : null,
    accumulated_ms: Number(r.accumulated_ms) || 0,
    ended_at: r.ended_at ? String(r.ended_at) : null,
    mode: r.mode === "pomodoro" ? "pomodoro" : "stopwatch",
    phase: r.phase === "short_break" || r.phase === "long_break" ? r.phase : "focus",
    phase_started_at: r.phase_started_at ? String(r.phase_started_at) : null,
    focus_duration_ms: r.focus_duration_ms ? Number(r.focus_duration_ms) : null,
    phase_duration_ms: r.phase_duration_ms ? Number(r.phase_duration_ms) : null,
    phase_accumulated_ms: Number(r.phase_accumulated_ms) || 0,
    cycles_completed: Number(r.cycles_completed) || 0,
    short_break_ms: r.short_break_ms ? Number(r.short_break_ms) : 300_000,
    long_break_ms: r.long_break_ms ? Number(r.long_break_ms) : 900_000,
    long_break_every: r.long_break_every !== undefined ? Number(r.long_break_every) : 4,
    objective: r.objective ? String(r.objective) : null,
  };
}

/** Active study time. serverNowMs is the client clock corrected by the server offset. */
export function elapsedMs(t: TimerRow, serverNowMs: number) {
  const running = t.status === "running" && t.segment_started_at ? Math.max(0, serverNowMs - Date.parse(t.segment_started_at)) : 0;
  if (t.mode === "pomodoro" && t.phase === "focus" && t.phase_duration_ms) {
    const phaseAcc = t.phase_accumulated_ms ?? 0;
    const remainingInPhase = Math.max(0, t.phase_duration_ms - phaseAcc);
    const credited = Math.min(running, remainingInPhase);
    return t.accumulated_ms + credited;
  }
  return t.accumulated_ms + running;
}
