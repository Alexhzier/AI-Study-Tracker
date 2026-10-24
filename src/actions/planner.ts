"use server";

import { revalidatePath } from "next/cache";
import { APICallError, NoObjectGeneratedError } from "ai";
import { addDays, addWeeks, format, isValid, parseISO } from "date-fns";
import { z } from "zod";
import { aiConfig } from "@/lib/ai/config";
import { buildPlanningContext } from "@/lib/ai/context";
import { generateDraft } from "@/lib/ai/generate";
import { planItemSchema } from "@/lib/ai/schema";
import type { GenerateResult } from "@/lib/ai/types";
import { finishUsage, reserveUsage, UsageLimitError } from "@/lib/ai/usage";
import { weekStartISO } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/time";
import type { ActionResult } from "@/lib/types";

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const refresh = () => revalidatePath("/", "layout");

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function friendlyAiError(e: unknown): string {
  if (NoObjectGeneratedError.isInstance(e)) return "The AI returned a plan we couldn't read. Try generating again.";
  if (APICallError.isInstance(e)) {
    if (/api key/i.test(e.message)) return "The AI service rejected this app's API key. The site owner needs to check it.";
    if (e.statusCode === 401 || e.statusCode === 403) return "The AI service rejected this app's API key. The site owner needs to check it.";
    if (e.statusCode === 429) return "The AI service is busy or out of quota. Try again in a few minutes.";
    if (e.statusCode && e.statusCode >= 500) return "The AI service had a problem. Try again shortly.";
    return "The AI request failed. Try again.";
  }
  if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
    return "The AI took too long to respond. Try again.";
  }
  return "Couldn't generate a plan. Try again.";
}

// ------------------------------------------------------------------ generate
export async function generatePlan(week: "this" | "next"): Promise<GenerateResult> {
  const cfg = aiConfig();
  if (!cfg.enabled) {
    return { error: "Live AI generation isn't enabled on this server." };
  }
  if (week !== "this" && week !== "next") return { error: "Choose a week." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const thisWeek = weekStartISO(todayISO());
  const weekStart = week === "this" ? thisWeek : iso(addWeeks(parseISO(thisWeek), 1));

  // All statistics are computed here in code before the model is involved.
  const ctx = await buildPlanningContext(weekStart);
  if ("error" in ctx) return { error: ctx.error };

  let usageId: string;
  try {
    usageId = await reserveUsage(supabase, cfg, Boolean(user.is_anonymous));
  } catch (e) {
    if (e instanceof UsageLimitError) {
      const limit = user.is_anonymous ? cfg.guestLimit : cfg.dailyLimit;
      return {
        error:
          e.reason === "daily"
            ? `You've used all ${limit} AI plans for the last 24 hours. Try again later, or build a plan by hand.`
            : e.reason === "global"
              ? "The demo's AI allowance for today has been used up. Please try again tomorrow."
              : `Please wait ${cfg.cooldownSeconds} seconds between plans.`,
      };
    }
    console.error("ai usage reserve failed:", e instanceof Error ? e.message : e);
    return { error: "Couldn't start the AI request. Make sure the AI planner migration has been applied." };
  }

  try {
    const r = await generateDraft(ctx, cfg);
    await finishUsage(supabase, usageId, true, { input: r.inputTokens, output: r.outputTokens });
    revalidatePath("/planner");

    if (r.items.length === 0) {
      return { error: "The AI couldn't produce a plan that fits your availability and goal. Try generating again." };
    }
    return {
      draft: {
        weekStart,
        summary: r.summary,
        notes: r.notes,
        items: r.items,
        warnings: r.warnings,
        historyLevel: ctx.stats.history_level,
        model: cfg.model,
        capacity: ctx.capacity,
      },
    };
  } catch (e) {
    console.error("ai generation failed:", e instanceof Error ? `${e.name}: ${e.message}` : e);
    await finishUsage(supabase, usageId, false);
    return { error: friendlyAiError(e) };
  }
}

// ------------------------------------------------------------------- approve
const approveSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summary: z.string().max(600).optional(),
  model: z.string().max(100).optional(),
  items: z.array(planItemSchema).min(1, "Add at least one session before approving.").max(60, "A plan can have up to 60 sessions."),
});

export async function approvePlan(input: z.input<typeof approveSchema>): Promise<ActionResult> {
  const parsed = approveSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { weekStart, summary, model, items } = parsed.data;

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const today = todayISO();
  const ws = parseISO(weekStart);
  if (!isValid(ws) || iso(ws) !== weekStart || ws.getDay() !== 1) return { error: "Invalid plan week." };
  if (weekStart < weekStartISO(today)) return { error: "You can't approve a plan for a past week." };
  const weekEnd = iso(addDays(ws, 6));

  const perDay = new Map<string, number>();
  for (const it of items) {
    if (it.date < weekStart || it.date > weekEnd) return { error: "Every session must fall inside the plan's week." };
    if (it.date < today) return { error: "Sessions can't be planned on days that have already passed." };
    perDay.set(it.date, (perDay.get(it.date) ?? 0) + it.duration_minutes);
  }
  for (const [date, minutes] of perDay) {
    if (minutes > 1440) return { error: `${date} has more than 24 hours planned.` };
  }

  // Subjects must be real, owned by this user (RLS) and not archived.
  const ids = [...new Set(items.map((i) => i.subject_id))];
  const { data: subjects, error: sErr } = await supabase.from("subjects").select("id,is_archived").in("id", ids);
  if (sErr) return { error: "Couldn't verify your subjects. Try again." };
  if ((subjects ?? []).length !== ids.length) return { error: "A planned subject no longer exists. Regenerate the plan." };
  if ((subjects ?? []).some((s: { is_archived: boolean }) => s.is_archived)) return { error: "A planned subject is archived. Restore it or remove its sessions." };

  const { error } = await supabase.rpc("approve_study_plan", {
    p_week_start: weekStart,
    p_summary: summary ?? null,
    p_model: model ?? null,
    p_items: items.map((i) => ({
      subject_id: i.subject_id,
      topic: i.topic,
      planned_date: i.date,
      duration_minutes: i.duration_minutes,
      explanation: i.explanation,
      source: i.source,
    })),
  });
  if (error) {
    console.error("approve_study_plan failed:", error.message);
    return { error: "Couldn't save the plan. Try again." };
  }
  refresh();
  return {};
}

export async function archivePlan(planId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(planId).success) return { error: "Invalid plan." };
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired. Sign in again." };
  const { error } = await supabase.from("study_plans").update({ status: "archived" }).eq("id", planId);
  if (error) return { error: "Couldn't remove the plan. Try again." };
  refresh();
  return {};
}

// ------------------------------------------------------------------ settings
const settingsSchema = z.object({
  weeklyGoalMinutes: z.number().int().min(1, "Enter a weekly goal above zero, or leave it empty.").max(10080, "A week only has 168 hours.").nullable(),
  availability: z.record(z.string().regex(/^[1-7]$/), z.number().int().min(0).max(1440, "A day only has 24 hours.")),
  priorities: z.array(z.object({ subject_id: z.string().uuid(), priority: z.number().int().min(1).max(5) })).max(200),
});

export async function savePlannerSettings(input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { weeklyGoalMinutes, availability, priorities } = parsed.data;

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const fail = { error: "Couldn't save your settings. Try again." };

  const a = await supabase
    .from("planner_settings")
    .upsert({ user_id: user.id, weekly_goal_minutes: weeklyGoalMinutes, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (a.error) return fail;

  const on = Object.entries(availability).filter(([, m]) => m > 0).map(([d, m]) => ({ user_id: user.id, weekday: Number(d), available_minutes: m }));
  const off = Object.entries(availability).filter(([, m]) => m === 0).map(([d]) => Number(d));
  if (on.length) {
    const r = await supabase.from("planner_availability").upsert(on, { onConflict: "user_id,weekday" });
    if (r.error) return fail;
  }
  if (off.length) {
    const r = await supabase.from("planner_availability").delete().in("weekday", off);
    if (r.error) return fail;
  }

  if (priorities.length) {
    const r = await supabase
      .from("planner_subject_settings")
      .upsert(priorities.map((p) => ({ user_id: user.id, ...p })), { onConflict: "user_id,subject_id" });
    if (r.error) return { error: "Couldn't save subject priorities. Make sure each subject still exists." };
  }

  refresh();
  return {};
}

// --------------------------------------------------------------------- exams
const examSchema = z.object({
  subject_id: z.string().uuid("Choose a subject."),
  title: z.string().trim().min(1, "Enter an exam name.").max(120, "Use 120 characters or fewer."),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the exam date."),
  notes: z.string().trim().max(500, "Notes can be up to 500 characters.").optional(),
});

export async function addExam(input: z.input<typeof examSchema>): Promise<ActionResult> {
  const parsed = examSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { subject_id, title, exam_date, notes } = parsed.data;

  const d = parseISO(exam_date);
  if (!isValid(d) || iso(d) !== exam_date) return { error: "Choose a valid date." };
  const today = todayISO();
  if (exam_date < today) return { error: "The exam date can't be in the past." };
  if (exam_date > iso(addDays(parseISO(today), 730))) return { error: "The exam date is too far ahead." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { error } = await supabase.from("exams").insert({ subject_id, title, exam_date, notes: notes || null });
  if (error) return { error: "Couldn't save the exam. Try again." };
  refresh();
  return {};
}

export async function deleteExam(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { error: "Invalid exam." };
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired. Sign in again." };
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the exam. Try again." };
  refresh();
  return {};
}

// --------------------------------------------------------------------- goals
const goalsSchema = z.object({
  dailyMinutes: z.number().int().min(1, "Enter a daily goal above zero, or leave it empty.").max(1440, "A day only has 24 hours.").nullable(),
  weeklyMinutes: z.number().int().min(1, "Enter a weekly goal above zero, or leave it empty.").max(10080, "A week only has 168 hours.").nullable(),
  subjectTargets: z
    .array(z.object({
      subject_id: z.string().uuid(),
      minutes: z.number().int().min(1, "Subject targets must be above zero.").max(10080, "A week only has 168 hours.").nullable(),
    }))
    .max(200),
});

export async function saveGoals(input: z.input<typeof goalsSchema>): Promise<ActionResult> {
  const parsed = goalsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { dailyMinutes, weeklyMinutes, subjectTargets } = parsed.data;

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const fail = { error: "Couldn't save your goals. Try again." };

  const a = await supabase.from("planner_settings").upsert(
    { user_id: user.id, daily_goal_minutes: dailyMinutes, weekly_goal_minutes: weeklyMinutes, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (a.error) {
    console.error("save goals failed:", a.error.message);
    return fail;
  }

  const set = subjectTargets.filter((t) => t.minutes !== null);
  const clear = subjectTargets.filter((t) => t.minutes === null).map((t) => t.subject_id);
  if (set.length) {
    const r = await supabase.from("planner_subject_settings").upsert(
      set.map((t) => ({ user_id: user.id, subject_id: t.subject_id, weekly_target_minutes: t.minutes })),
      { onConflict: "user_id,subject_id" },
    );
    if (r.error) return { error: "Couldn't save subject targets. Make sure each subject still exists." };
  }
  if (clear.length) {
    const r = await supabase.from("planner_subject_settings").update({ weekly_target_minutes: null }).in("subject_id", clear);
    if (r.error) return fail;
  }

  refresh();
  return {};
}
