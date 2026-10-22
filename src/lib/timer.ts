export type TimerRow = {
  subject_id: string;
  status: "running" | "paused" | "stopped";
  started_at: string;
  segment_started_at: string | null;
  accumulated_ms: number;
  ended_at: string | null;
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
  };
}

/** Active study time. serverNowMs is the client clock corrected by the server offset. */
export function elapsedMs(t: TimerRow, serverNowMs: number) {
  const running = t.status === "running" && t.segment_started_at ? Math.max(0, serverNowMs - Date.parse(t.segment_started_at)) : 0;
  return t.accumulated_ms + running;
}
