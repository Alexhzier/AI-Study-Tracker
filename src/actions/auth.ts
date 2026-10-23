"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { APP_TZ } from "@/lib/time";

export type AuthState = { error?: string } | undefined;

const credentials = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer."),
});

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email or password is incorrect." };
  redirect("/dashboard");
}

export async function register(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) return { error: error.message };
  // If email confirmation is enabled in Supabase there is no session yet.
  if (!data.session) redirect("/login?check_email=1");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Creates a temporary guest account with sample data so visitors can try the app. */
export async function startDemo(_: AuthState): Promise<AuthState> {
  const supabase = await createClient();
  const { data: { user: existing } } = await supabase.auth.getUser();
  if (existing) redirect("/dashboard");

  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("demo sign-in failed:", error.message);
    return { error: "The demo isn't available right now. Please try again later." };
  }
  const { error: seedError } = await supabase.rpc("seed_demo_data", { p_timezone: APP_TZ });
  if (seedError) {
    console.error("demo seed failed:", seedError.message);
    return { error: "Couldn't prepare the demo data. Please try again." };
  }
  redirect("/dashboard");
}
