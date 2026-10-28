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
  invalid_duration: "Focus duration must be between 1 and 180 minutes.",
  invalid_short_break: "Short break must be between 1 and 60 minutes.",
  invalid_long_break: "Long break must be between 1 and 60 minutes.",
  invalid_long_break_interval: "Long break interval must be between 2 and 12 cycles, or 0 to disable.",
  phase_completed: "The focus phase has already completed its duration.",
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

export async function focusCapabilities(): Promise<{ supported: boolean; version?: number }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("focus_capabilities");
    if (error || !data || typeof data !== "object") return { supported: false };
    const res = data as Record<string, unknown>;
    return { supported: Boolean(res.supported), version: Number(res.version) || 1 };
  } catch {
    return { supported: false };
  }
}

export async function timerStart(subjectId: string): Promise<TimerResult> {
  if (!z.string().uuid().safeParse(subjectId).success) return { error: "Choose a subject." };
  return run("timer_start", { p_subject_id: subjectId });
}

export async function timerPause(): Promise<TimerResult> { return run("timer_pause"); }
export async function timerResume(): Promise<TimerResult> { return run("timer_resume"); }
export async function timerStop(): Promise<TimerResult> { return run("timer_stop"); }
export async function timerDiscard(): Promise<TimerResult> { return run("timer_discard"); }

export async function timerSave(notes?: string, expectedEndedAt?: string): Promise<TimerResult & { alreadySaved?: boolean }> {
  const parsed = z.string().trim().max(2000, "Notes can be up to 2,000 characters.").optional().safeParse(notes);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const res = await run("timer_save", { p_notes: parsed.data ?? null, p_timezone: APP_TZ }, true);
  
  // Safeguard 3: If no_timer is returned on retry, verify if the session was already saved
  // rather than blindly assuming success or failing a legitimate save retry.
  if (res.error && res.error === MESSAGES.no_timer && expectedEndedAt) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: session } = await supabase
          .from("study_sessions")
          .select("id,ended_at")
          .eq("user_id", user.id)
          .eq("ended_at", expectedEndedAt)
          .maybeSingle();

        if (session) {
          return { timer: null, alreadySaved: true };
        }
      }
    } catch (e) {
      console.error("Failed to verify saved session on retry:", e);
    }
  }

  return res;
}

const focusStartSchema = z.object({
  subjectId: z.string().uuid("Choose a subject."),
  durationMinutes: z.number().int().min(1, "Minimum focus is 1 minute.").max(180, "Maximum focus is 180 minutes."),
  shortBreakMinutes: z.number().int().min(1).max(60).default(5),
  longBreakMinutes: z.number().int().min(1).max(60).default(15),
  longBreakEvery: z.number().int().refine((n) => n === 0 || (n >= 2 && n <= 12), {
    message: "Long break interval must be 0 (disabled) or between 2 and 12 cycles.",
  }).default(4),
  objective: z.string().trim().max(200, "Objective can be up to 200 characters.").optional(),
});

export async function timerFocusStart(input: {
  subjectId: string;
  durationMinutes: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  longBreakEvery?: number;
  objective?: string;
}): Promise<TimerResult> {
  const parsed = focusStartSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  return run("timer_focus_start", {
    p_subject_id: parsed.data.subjectId,
    p_duration_ms: parsed.data.durationMinutes * 60 * 1000,
    p_short_break_ms: parsed.data.shortBreakMinutes * 60 * 1000,
    p_long_break_ms: parsed.data.longBreakMinutes * 60 * 1000,
    p_long_break_every: parsed.data.longBreakEvery,
    p_objective: parsed.data.objective ?? null,
  });
}

export async function timerFocusNextPhase(params: {
  expectedPhaseStartedAt: string;
  autoStartFocus?: boolean;
}): Promise<TimerResult> {
  return run("timer_focus_next_phase", {
    p_expected_phase_started_at: params.expectedPhaseStartedAt,
    p_auto_start_focus: Boolean(params.autoStartFocus),
  });
}

export async function timerFocusSkipBreak(params: {
  expectedPhaseStartedAt: string;
  autoStartFocus?: boolean;
}): Promise<TimerResult> {
  return run("timer_focus_skip_break", {
    p_expected_phase_started_at: params.expectedPhaseStartedAt,
    p_auto_start_focus: Boolean(params.autoStartFocus),
  });
}

export async function timerFocusUpdateObjective(objective: string): Promise<TimerResult> {
  const parsed = z.string().trim().max(200, "Objective can be up to 200 characters.").safeParse(objective);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  return run("timer_focus_update_objective", {
    p_objective: parsed.data,
  });
}
