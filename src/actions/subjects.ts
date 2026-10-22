"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

const subjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Enter a subject name.").max(80, "Use 80 characters or fewer."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid color."),
});

const DUPLICATE = "You already have an active subject with that name.";

export async function saveSubject(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v.trim() === "" && k === "id" ? undefined : v]),
  );
  const parsed = subjectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, name, color } = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  if (id) {
    const { data, error } = await supabase.from("subjects").update({ name, color }).eq("id", id).select("id");
    if (error) return { error: error.code === "23505" ? DUPLICATE : "Couldn't save the subject. Try again." };
    if (!data?.length) return { error: "That subject no longer exists." };
  } else {
    const { error } = await supabase.from("subjects").insert({ name, color });
    if (error) return { error: error.code === "23505" ? DUPLICATE : "Couldn't save the subject. Try again." };
  }
  revalidatePath("/", "layout");
  return {};
}

export async function setSubjectArchived(id: string, archived: boolean): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { error: "Invalid subject." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { error } = await supabase.from("subjects").update({ is_archived: archived }).eq("id", id);
  if (error) {
    return {
      error: error.code === "23505"
        ? "Another active subject already uses this name. Rename it first."
        : "Couldn't update the subject. Try again.",
    };
  }
  revalidatePath("/", "layout");
  return {};
}
