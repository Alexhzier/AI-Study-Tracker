"use server";

import { revalidatePath } from "next/cache";
import { TZDate } from "@date-fns/tz";
import { format, isValid, parseISO } from "date-fns";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { APP_TZ, todayISO } from "@/lib/time";
import type { ActionResult } from "@/lib/types";

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

const sessionSchema = z.object({
  id: z.string().uuid().optional(),
  subject_id: z.string().uuid("Choose a subject."),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  start_time: z.string().regex(timeRe, "Enter a valid start time.").optional(),
  end_time: z.string().regex(timeRe, "Enter a valid end time.").optional(),
  hours: z.coerce.number().int("Hours must be a whole number.").min(0).max(24, "Hours can't exceed 24.").optional(),
  minutes: z.coerce.number().int("Minutes must be a whole number.").min(0).max(59, "Minutes must be 0 to 59.").optional(),
  notes: z.string().trim().max(2000, "Notes can be up to 2,000 characters.").optional(),
});

const clean = (fd: FormData) =>
  Object.fromEntries(
    [...fd.entries()].map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? undefined : v]),
  );

const toTz = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new TZDate(y, m - 1, d, hh, mm, 0, APP_TZ);
};

export async function saveSession(formData: FormData): Promise<ActionResult> {
  const parsed = sessionSchema.safeParse(clean(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, subject_id, session_date, start_time, end_time, hours, minutes, notes } = parsed.data;

  const parsedDate = parseISO(session_date);
  if (!isValid(parsedDate) || format(parsedDate, "yyyy-MM-dd") !== session_date) {
    return { error: "Choose a valid date." };
  }
  if (session_date > todayISO()) return { error: "The date can't be in the future." };

  let duration: number;
  let started_at: string | null = null;
  let ended_at: string | null = null;

  if (start_time || end_time) {
    if (!start_time || !end_time) return { error: "Enter both a start and end time, or leave both empty." };
    const s = toTz(session_date, start_time);
    const e = toTz(session_date, end_time);
    duration = Math.round((e.getTime() - s.getTime()) / 60000);
    if (duration <= 0) return { error: "End time must be after start time." };
    const typed = (hours ?? 0) * 60 + (minutes ?? 0);
    if (typed > 0 && typed !== duration) {
      return { error: "Duration doesn't match the start and end times. Clear one or the other." };
    }
    started_at = s.toISOString();
    ended_at = e.toISOString();
  } else {
    duration = (hours ?? 0) * 60 + (minutes ?? 0);
    if (duration <= 0) return { error: "Enter a duration greater than zero, or a start and end time." };
  }
  if (duration > 1440) return { error: "A single session can't exceed 24 hours." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  // New sessions can't go on an archived subject (an existing session may keep its subject).
  const { data: subject } = await supabase.from("subjects").select("id,is_archived").eq("id", subject_id).maybeSingle();
  if (!subject) return { error: "That subject no longer exists." };
  if (subject.is_archived) {
    let keepsSubject = false;
    if (id) {
      const { data: existing } = await supabase.from("study_sessions").select("subject_id").eq("id", id).maybeSingle();
      keepsSubject = existing?.subject_id === subject_id;
    }
    if (!keepsSubject) return { error: "That subject is archived. Restore it or pick another subject." };
  }

  const payload = { subject_id, session_date, started_at, ended_at, duration_minutes: duration, notes: notes ?? null };

  if (id) {
    const { data, error } = await supabase.from("study_sessions").update(payload).eq("id", id).select("id");
    if (error) return { error: "Couldn't save the session. Try again." };
    if (!data?.length) return { error: "That session no longer exists." };
  } else {
    const { error } = await supabase.from("study_sessions").insert(payload);
    if (error) return { error: "Couldn't save the session. Try again." };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function deleteSession(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { error: "Invalid session." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { error } = await supabase.from("study_sessions").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the session. Try again." };
  revalidatePath("/", "layout");
  return {};
}
