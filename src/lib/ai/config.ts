/** Server-only. Never import this from a client component. */
function int(v: string | undefined, fallback: number, min: number, max: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback;
}

export type AiProvider = "openai" | "google";

export function aiConfig() {
  const provider: AiProvider = process.env.AI_PROVIDER === "google" ? "google" : "openai";
  const model = process.env.AI_MODEL ?? process.env.OPENAI_MODEL; // OPENAI_MODEL kept for compatibility
  const hasKey =
    provider === "google" ? Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY) : Boolean(process.env.OPENAI_API_KEY);
  return {
    enabled: Boolean(hasKey && model),
    provider,
    model: model ?? "",
    /** Plan generations allowed per user in any rolling 24 hours. */
    dailyLimit: int(process.env.AI_DAILY_PLAN_LIMIT, 5, 1, 100),
    /** Plans each demo guest may generate in 24 hours. */
    guestLimit: int(process.env.AI_GUEST_PLAN_LIMIT, 2, 1, 20),
    /** Plans ALL demo guests together may generate in 24 hours. */
    guestGlobalLimit: int(process.env.AI_GUEST_GLOBAL_DAILY_LIMIT, 30, 1, 1000),
    /** Minimum seconds between two generations. */
    cooldownSeconds: int(process.env.AI_COOLDOWN_SECONDS, 20, 0, 3600),
    /** Hard cap on tokens the model may produce (reasoning models count thinking tokens too). */
    maxOutputTokens: int(process.env.AI_MAX_OUTPUT_TOKENS, 6000, 1000, 16000),
    /** Set AI_SHARE_NOTES=false to keep your free-text session notes out of AI requests. */
    shareNotes: process.env.AI_SHARE_NOTES !== "false",
  };
}
