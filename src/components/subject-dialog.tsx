"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSubject } from "@/actions/subjects";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/lib/ui";

const PRESETS = ["#2f6f6a", "#3b6ea5", "#7a5aa6", "#b5546b", "#c27a2c", "#6b8e3d", "#8a6d4b", "#5b6770"];

export function SubjectDialog({ subject, children }: { subject?: Subject; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{subject ? "Edit subject" : "New subject"}</DialogTitle>
          <DialogDescription>Pick a name and a color to recognize it on charts and the calendar.</DialogDescription>
        </DialogHeader>
        <SubjectForm subject={subject} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SubjectForm({ subject, onDone }: { subject?: Subject; onDone: () => void }) {
  const [color, setColor] = useState(subject?.color ?? PRESETS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (subject) fd.set("id", subject.id);
    setError(null);
    startTransition(async () => {
      const res = await saveSubject(fd);
      if (res.error) return setError(res.error);
      toast.success(subject ? "Subject updated" : "Subject created");
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <input id="name" name="name" required maxLength={80} defaultValue={subject?.name ?? ""} className={fieldClass} autoFocus />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Color</span>
        <input type="hidden" name="color" value={color} />
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Color">
          {PRESETS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c}
              onClick={() => setColor(c)} style={{ backgroundColor: c }}
              className={cn("size-7 rounded-full border border-black/10 transition-shadow",
                color === c && "ring-2 ring-ring ring-offset-2 ring-offset-background")} />
          ))}
          <label className="ml-1 flex items-center gap-2 text-xs text-muted-foreground">
            Custom
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="size-7 cursor-pointer rounded border border-input bg-transparent p-0.5" />
          </label>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : subject ? "Save changes" : "Create subject"}</Button>
      </div>
    </form>
  );
}
