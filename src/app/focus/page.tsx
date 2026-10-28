import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { focusCapabilities } from "@/actions/timer";
import { FocusArena } from "@/components/focus/focus-arena";
import { getSubjects } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Focus Mode · Study Tracker",
  description: "Distraction-free focus environment with Pomodoro and Stopwatch timers.",
};

export default async function FocusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [subjects, capabilities] = await Promise.all([
    getSubjects().catch(() => []),
    focusCapabilities().catch(() => ({ supported: false })),
  ]);

  return (
    <FocusArena
      subjects={subjects ?? []}
      userId={user.id}
      initialCapabilities={capabilities ?? { supported: false }}
    />
  );
}
