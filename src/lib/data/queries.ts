import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Session, SessionLite, Subject } from "@/lib/types";

const PAGE = 1000; // Supabase returns at most 1000 rows per request

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

async function fetchAll<T>(run: (from: number, to: number) => Page<T>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await run(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export const getSubjects = cache(async (): Promise<Subject[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id,name,color,is_archived,created_at")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Subject[];
});

/** Every session, minimal columns. Used for all-time totals, streaks and per-subject totals. */
export const getSessionLite = cache(async (): Promise<SessionLite[]> => {
  const supabase = await createClient();
  return fetchAll<SessionLite>((f, t) =>
    supabase
      .from("study_sessions")
      .select("subject_id,session_date,duration_minutes")
      .order("created_at")
      .order("id")
      .range(f, t),
  );
});

export async function listSessions(opts: {
  from?: string;
  to?: string;
  subjectId?: string;
  limit?: number;
}): Promise<Session[]> {
  const supabase = await createClient();
  const build = (f: number, t: number) => {
    let q = supabase
      .from("study_sessions")
      .select("id,subject_id,session_date,started_at,ended_at,duration_minutes,notes,objective,pomodoro_cycles,created_at")
      .order("session_date", { ascending: false })
      .order("started_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .order("id");
    if (opts.from) q = q.gte("session_date", opts.from);
    if (opts.to) q = q.lte("session_date", opts.to);
    if (opts.subjectId) q = q.eq("subject_id", opts.subjectId);
    return q.range(f, t);
  };
  if (opts.limit) {
    const { data, error } = await build(0, opts.limit - 1);
    if (error) throw new Error(error.message);
    return (data ?? []) as Session[];
  }
  return fetchAll<Session>(build);
}
