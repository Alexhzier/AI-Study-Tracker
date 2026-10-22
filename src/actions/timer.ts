"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { toLocalDateISO } from "@/lib/time";
import type { ActionResult } from "@/lib/types";

const schema = z.object({
  subject_id: z.string().uuid("Choose a subject."),
  started_at: z.number().int().positive(),
  ended_at: z.number().int().positive(),
  duration_minutes: z.number().int().min(1, "Study at least one minute to save.").max(1440, "A single session can't exceed 24 hours."),
  notes: z.string().trim().max(2000, "Notes can be up to 2,000 characters.").optional(),
});

/**
 * Saves a finished timer run. duration_minutes is the *active* time (pauses excluded),
 * so it can be shorter than ended_at - started_at.
 */
export async function saveTimerSession(input: z.input<typeof schema>): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { subject_id, started_at, ended_at, duration_minutes, notes } = parsed.data;

  const elapsedMin = (ended_at - started_at) / 60000;
  if (ended_at <= started_at) return { error: "The timer's end time is before its start time." };
  if (ended_at > Date.now() + 60_000) return { error: "The timer's end time is in the future. Check your device clock." };
  if (duration_minutes > elapsedMin + 1) return { error: "Studied time can't exceed the time between start and stop." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { data: subject } = await supabase.from("subjects").select("id,is_archived").eq("id", subject_id).maybeSingle();
  if (!subject) return { error: "That subject no longer exists. Discard this session or log it manually." };
  if (subject.is_archived) return { error: "That subject is archived. Restore it, then save." };

  const { error } = await supabase.from("study_sessions").insert({
    subject_id,
    session_date: toLocalDateISO(started_at),
    started_at: new Date(started_at).toISOString(),
    ended_at: new Date(ended_at).toISOString(),
    duration_minutes,
    notes: notes || null,
  });
  if (error) return { error: "Couldn't save the session. Your timer is kept, so try again." };

  revalidatePath("/", "layout");
  return {};
}
