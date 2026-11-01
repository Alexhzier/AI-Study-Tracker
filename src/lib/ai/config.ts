/** Server-only. Never import this from a client component. */
function int(v: string | undefined, fallback: number, min: number, max: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback;
}

export type AiProvider = "openai" | "google";

function clean(v: string | undefined): string {
  return (v ?? "").trim().replace(/^['"]|['"]$/g, "");
}

function normalizeGoogleModel(raw: string, fallback: string): string {
  if (!raw || /^(gpt-|o1|o3|o4)/i.test(raw)) return fallback;
  const lower = raw.toLowerCase().trim();
  const slug = lower.replace(/^google\s+/i, "").replace(/geminit/g, "gemini").replace(/\s+/g, "-");
  if (slug === "gemini-3.1-flash-lite") return "gemini-3.1-flash-lite-preview";
  if (slug.startsWith("gemini-")) return slug;
  return raw;
}

export function aiConfig() {
  const googleKey =
    clean(process.env.GOOGLE_GENERATIVE_AI_API_KEY) ||
    clean(process.env.GEMINI_API_KEY) ||
    clean(process.env.GOOGLE_API_KEY) ||
    clean(process.env.GOOGLE_AI_API_KEY) ||
    clean(process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY) ||
    clean(process.env.NEXT_PUBLIC_GEMINI_API_KEY) ||
    clean(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);

  const openaiKey =
    clean(process.env.OPENAI_API_KEY) ||
    clean(process.env.NEXT_PUBLIC_OPENAI_API_KEY);

  const genericKey =
    clean(process.env.AI_API_KEY) ||
    clean(process.env.API_KEY);

  // Detect if a Google key ("AIza...") was placed in OPENAI_API_KEY or AI_API_KEY
  const effectiveGoogleKey =
    googleKey ||
    (openaiKey.startsWith("AIza") ? openaiKey : "") ||
    (genericKey.startsWith("AIza") ? genericKey : "");

  const effectiveOpenaiKey =
    (!openaiKey.startsWith("AIza") ? openaiKey : "") ||
    (!genericKey.startsWith("AIza") ? genericKey : "");

  const rawProvider = clean(process.env.AI_PROVIDER).toLowerCase();
  const provider: AiProvider =
    rawProvider === "google" || rawProvider === "gemini"
      ? "google"
      : rawProvider === "openai"
        ? "openai"
        : effectiveGoogleKey && !effectiveOpenaiKey
          ? "google"
          : effectiveOpenaiKey
            ? "openai"
            : "google";

  const apiKey = provider === "google" ? effectiveGoogleKey : effectiveOpenaiKey;
  const defaultModel = provider === "google" ? "gemini-2.5-flash" : "gpt-4o-mini";
  const rawModel = clean(process.env.AI_MODEL) || clean(process.env.OPENAI_MODEL);

  const model =
    !rawModel
      ? defaultModel
      : provider === "google"
        ? normalizeGoogleModel(rawModel, defaultModel)
        : /^gemini-/i.test(rawModel)
          ? defaultModel
          : rawModel;

  const hasKey = Boolean(apiKey);
  return {
    enabled: Boolean(hasKey && model),
    provider,
    model,
    apiKey,
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
