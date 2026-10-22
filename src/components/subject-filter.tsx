"use client";

import { useRouter } from "next/navigation";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/lib/ui";

export function SubjectFilter({ subjects, value }: { subjects: Subject[]; value?: string }) {
  const router = useRouter();
  return (
    <select
      aria-label="Filter by subject" value={value ?? ""}
      onChange={(e) => router.push(e.target.value ? `/sessions?subject=${e.target.value}` : "/sessions")}
      className={cn(fieldClass, "w-auto min-w-48")}
    >
      <option value="">All subjects</option>
      {subjects.map((s) => (
        <option key={s.id} value={s.id}>{s.name}{s.is_archived ? " (archived)" : ""}</option>
      ))}
    </select>
  );
}
