"use client";

import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { addExam, deleteExam } from "@/actions/planner";
import { Button } from "@/components/ui/button";
import type { Exam } from "@/lib/ai/types";
import { todayISO } from "@/lib/time";
import type { Subject } from "@/lib/types";
import { fieldClass } from "@/lib/ui";

export function ExamsManager({ exams, subjects }: { exams: Exam[]; subjects: Subject[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const active = subjects.filter((s) => !s.is_archived);
  const today = todayISO();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res = await addExam({
        subject_id: String(fd.get("subject_id") ?? ""),
        title: String(fd.get("title") ?? ""),
        exam_date: String(fd.get("exam_date") ?? ""),
        notes: String(fd.get("notes") ?? "") || undefined,
      });
      if (res.error) return setError(res.error);
      toast.success("Exam added");
      formRef.current?.reset();
    });
  }

  return (
    <div className="space-y-4">
      {exams.length === 0 ? (
        <p className="text-sm text-muted-foreground">No exams yet. The planner only uses exam dates you add here.</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {exams.map((x) => {
            const s = subjects.find((y) => y.id === x.subject_id);
            const past = x.exam_date < today;
            return (
              <li key={x.id} className={`flex items-center gap-3 px-4 py-2.5 ${past ? "opacity-60" : ""}`}>
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s?.color ?? "#999" }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{x.title} · {s?.name ?? "Subject"}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(x.exam_date), "EEE, MMM d, yyyy")}{past ? " · past" : ""}</p>
                </div>
                <Button variant="ghost" size="icon" aria-label={`Delete ${x.title}`} className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (!confirm("Delete this exam?")) return;
                    start(async () => {
                      const r = await deleteExam(x.id);
                      if (r.error) toast.error(r.error); else toast.success("Exam deleted");
                    });
                  }}>
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {active.length > 0 && (
        <form ref={formRef} onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="exam-subject" className="text-sm font-medium">Subject</label>
            <select id="exam-subject" name="subject_id" required className={fieldClass}>
              {active.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="exam-title" className="text-sm font-medium">Exam name</label>
            <input id="exam-title" name="title" required maxLength={120} placeholder="Midterm" className={fieldClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="exam-date" className="text-sm font-medium">Date</label>
            <input id="exam-date" name="exam_date" type="date" required min={today} className={fieldClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="exam-notes" className="text-sm font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
            <input id="exam-notes" name="notes" maxLength={500} className={fieldClass} />
          </div>
          {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Add exam"}</Button></div>
        </form>
      )}
    </div>
  );
}
