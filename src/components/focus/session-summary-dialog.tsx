"use client";

import { CheckCircle2, Clock, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { timerDiscard, timerSave } from "@/actions/timer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMinutes } from "@/lib/time";
import type { TimerRow } from "@/lib/timer";
import type { Subject } from "@/lib/types";
import { textareaClass } from "@/lib/ui";

interface SessionSummaryDialogProps {
  isOpen: boolean;
  timer: TimerRow | null;
  subject?: Subject;
  onSaved: () => void;
  onDiscarded: () => void;
}

export function SessionSummaryDialog({
  isOpen,
  timer,
  subject,
  onSaved,
  onDiscarded,
}: SessionSummaryDialogProps) {
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!timer) return null;

  const minutes = Math.round(timer.accumulated_ms / 60000);
  const cycles = timer.cycles_completed ?? 0;
  const isTooShort = minutes < 1;

  const handleSave = async () => {
    if (isTooShort) return;
    setIsPending(true);
    setError(null);

    try {
      const res = await timerSave(notes.trim() || undefined, timer.ended_at ?? undefined);
      if (res.error) {
        setError(res.error);
        setIsPending(false);
        return;
      }
      toast.success(res.alreadySaved ? "Session already saved!" : "Study session saved!");
      onSaved();
    } catch (e) {
      setError("An unexpected error occurred while saving.");
      console.error(e);
    } finally {
      setIsPending(false);
    }
  };

  const handleDiscard = async () => {
    if (!confirm("Are you sure you want to discard this session? Recorded focus time will not be saved.")) {
      return;
    }
    setIsPending(true);
    try {
      const res = await timerDiscard();
      if (res.error) {
        setError(res.error);
        setIsPending(false);
        return;
      }
      toast.info("Session discarded.");
      onDiscarded();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Session Completed!
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Review your focused time and add any notes before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Key Metrics Summary Card */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/30 p-3.5 text-center">
            <div>
              <p className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="size-3.5" aria-hidden="true" /> Focused Time
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {isTooShort ? "< 1 min" : formatMinutes(minutes)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="size-3.5 text-amber-500" aria-hidden="true" /> Completed Cycles
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {cycles} {cycles === 1 ? "cycle" : "cycles"}
              </p>
            </div>
          </div>

          {/* Subject & Objective details */}
          <div className="rounded-lg border border-border/40 bg-card p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subject:</span>
              <span className="font-semibold flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full inline-block"
                  style={{ backgroundColor: subject?.color ?? "#10b981" }}
                  aria-hidden="true"
                />
                {subject?.name ?? "General Study"}
              </span>
            </div>
            {timer.objective && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Objective:</span>
                <span className="font-medium text-foreground max-w-[200px] truncate">
                  {timer.objective}
                </span>
              </div>
            )}
          </div>

          {/* Notes input */}
          <div>
            <label htmlFor="session-notes" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Session Notes (Optional)
            </label>
            <textarea
              id="session-notes"
              rows={3}
              maxLength={2000}
              placeholder="What did you accomplish during this focus session?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={textareaClass}
            />
          </div>

          {isTooShort && (
            <p className="text-xs text-amber-500 bg-amber-500/10 rounded-md p-2 text-center" role="alert">
              Study sessions must be at least 1 minute long to be recorded into your study history.
            </p>
          )}

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md p-2 text-center" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={handleDiscard}
            className="cursor-pointer"
          >
            Discard
          </Button>
          <Button
            type="button"
            disabled={isPending || isTooShort}
            onClick={handleSave}
            className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isPending ? "Saving…" : "Save Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
