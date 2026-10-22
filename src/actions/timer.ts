"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { APP_TZ } from "@/lib/time";
import { normalizeTimer, type TimerResult } from "@/lib/timer";

const MESSAGES: Record<string, string> = {
  subject_unavailable: "That subject is archived or no longer exists.",
  timer_exists: "A timer is already active, possibly on another device. Showing it now.",
  invalid_state: "The timer was changed on another device. Showing its latest state.",
  no_timer: "There's no active timer.",
  not_stopped: "Stop the timer before saving.",
  too_short: "Study at least one minute to save.",
  too_long: "A single session can't exceed 24 hours.",
};

function friendly(message: string) {
  for (const [key, text] of Object.entries(MESSAGES)) if (message.includes(key)) return text;
  return "Something went wrong. Try again.";
}

async function run(fn: string, args?: Record<string, unknown>, revalidate = false): Promise<TimerResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    console.error(`${fn} failed:`, error.message);
    return { error: friendly(error.message) };
  }
  if (revalidate) revalidatePath("/", "layout");
  return { timer: normalizeTimer(data?.timer), serverNow: Number(data?.server_now) || undefined };
}

export async function timerStart(subjectId: string): Promise<TimerResult> {
  if (!z.string().uuid().safeParse(subjectId).success) return { error: "Choose a subject." };
  return run("timer_start", { p_subject_id: subjectId });
}
export async function timerPause() { return run("timer_pause"); }
export async function timerResume() { return run("timer_resume"); }
export async function timerStop() { return run("timer_stop"); }
export async function timerDiscard() { return run("timer_discard"); }

export async function timerSave(notes?: string): Promise<TimerResult> {
  const parsed = z.string().trim().max(2000, "Notes can be up to 2,000 characters.").optional().safeParse(notes);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // Saving creates a session, so dashboard, calendar and analytics must refresh.
  return run("timer_save", { p_notes: parsed.data ?? null, p_timezone: APP_TZ }, true);
}
