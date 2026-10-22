import { z } from "zod";

/**
 * Schema handed to the model. Subject ids and dates are enums built from real data, so the
 * model cannot return an unknown subject or an unplannable date. Keywords like min/max are
 * left out on purpose (strict structured-output modes reject some of them); every bound is
 * enforced afterwards in validate.ts.
 */
export function buildAiOutputSchema(subjectIds: string[], dates: string[]) {
  return z.object({
    summary: z.string().describe("One or two sentences describing the week's focus."),
    notes_for_user: z
      .string()
      .nullable()
      .describe("One short caveat for the student, e.g. limited history. Null if none."),
    items: z.array(
      z.object({
        subject_id: z.enum(subjectIds as [string, ...string[]]),
        topic: z.string().nullable().describe("Only if supported by recent_notes or the subject name; otherwise null."),
        date: z.enum(dates as [string, ...string[]]),
        duration_minutes: z.number().int().describe("15 to 120, multiples of 5."),
        explanation: z.string().describe("1-2 sentences citing concrete numbers from the input."),
      }),
    ),
  });
}

/** Validates items coming back from the browser (AI, edited or manual). */
export const planItemSchema = z.object({
  subject_id: z.string().uuid("Choose a subject for every session."),
  topic: z
    .string()
    .trim()
    .max(120, "Topics can be up to 120 characters.")
    .nullish()
    .transform((v) => (v ? v : null)),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
  duration_minutes: z
    .number()
    .int("Durations must be whole minutes.")
    .min(5, "Sessions must be at least 5 minutes.")
    .max(480, "Sessions can't exceed 8 hours."),
  explanation: z.string().trim().max(500).default(""),
  source: z.enum(["ai", "edited", "manual"]),
});
