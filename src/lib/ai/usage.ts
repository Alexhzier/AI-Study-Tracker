import { subDays } from "date-fns";
import type { createClient } from "@/lib/supabase/server";
import type { aiConfig } from "./config";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Cfg = ReturnType<typeof aiConfig>;

export class UsageLimitError extends Error {
  constructor(public reason: "daily" | "cooldown") {
    super(reason);
  }
}

/** Reserves one generation (atomically, in the database) before any model call is made. */
export async function reserveUsage(supabase: Supabase, cfg: Cfg): Promise<string> {
  const { data, error } = await supabase.rpc("ai_reserve_usage", {
    p_kind: "plan",
    p_model: cfg.model,
    p_daily_limit: cfg.dailyLimit,
    p_cooldown_seconds: cfg.cooldownSeconds,
  });
  if (error) {
    if (error.message.includes("daily_limit")) throw new UsageLimitError("daily");
    if (error.message.includes("cooldown")) throw new UsageLimitError("cooldown");
    throw new Error(error.message);
  }
  return data as string;
}

export async function finishUsage(
  supabase: Supabase,
  id: string,
  ok: boolean,
  tokens?: { input: number; output: number },
) {
  await supabase.rpc("ai_finish_usage", {
    p_id: id,
    p_status: ok ? "ok" : "failed",
    p_input_tokens: tokens?.input ?? 0,
    p_output_tokens: tokens?.output ?? 0,
  });
}

/** Generations left in the rolling 24 hours (failed attempts don't count). */
export async function remainingGenerations(supabase: Supabase, cfg: Cfg) {
  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("kind", "plan")
    .neq("status", "failed")
    .gte("created_at", subDays(new Date(), 1).toISOString());
  return Math.max(0, cfg.dailyLimit - (count ?? 0));
}
