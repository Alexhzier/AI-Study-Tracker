"use client";

import { FastForward, Pause, Play, Sparkles, Square } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { FocusMode, FocusPhase } from "@/lib/focus/timer";
import type { TimerRow } from "@/lib/timer";
import type { Subject } from "@/lib/types";
import { fieldClass } from "@/lib/ui";

export interface PomodoroPreset {
  id: string;
  name: string;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
}

export const POMODORO_PRESETS: PomodoroPreset[] = [
  { id: "classic", name: "Classic", focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15 },
  { id: "extended", name: "Extended", focusMinutes: 50, breakMinutes: 10, longBreakMinutes: 20 },
  { id: "deep", name: "Deep Work", focusMinutes: 90, breakMinutes: 15, longBreakMinutes: 30 },
];

interface PomodoroControlsProps {
  timer: TimerRow | null;
  subjects: Subject[];
  selectedSubjectId: string;
  onSubjectChange: (id: string) => void;
  objective: string;
  onObjectiveChange: (obj: string) => void;
  mode: FocusMode;
  onModeChange: (mode: FocusMode) => void;
  selectedPresetId: string;
  onPresetChange: (presetId: string) => void;
  customFocusMinutes: number;
  onCustomFocusMinutesChange: (mins: number) => void;
  customBreakMinutes: number;
  onCustomBreakMinutesChange: (mins: number) => void;
  onStartFocus: () => void;
  onStartStopwatch: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkipBreak: () => void;
  onStop: () => void;
  isPending: boolean;
  canUsePomodoro: boolean;
}

export function PomodoroControls({
  timer,
  subjects = [],
  selectedSubjectId,
  onSubjectChange,
  objective,
  onObjectiveChange,
  mode,
  onModeChange,
  selectedPresetId,
  onPresetChange,
  customFocusMinutes,
  onCustomFocusMinutesChange,
  customBreakMinutes,
  onCustomBreakMinutesChange,
  onStartFocus,
  onStartStopwatch,
  onPause,
  onResume,
  onSkipBreak,
  onStop,
  isPending,
  canUsePomodoro,
}: PomodoroControlsProps) {
  const [showCustom, setShowCustom] = useState(selectedPresetId === "custom");

  const activeSubjects = (subjects ?? []).filter((s) => !s.is_archived);

  // If timer is not active, render Setup / Configuration view
  if (!timer || timer.status === "stopped") {
    return (
      <div className="w-full max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
        {/* Subject & Objective Inputs */}
        <div className="space-y-3">
          <div>
            <label htmlFor="focus-subject-select" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Subject
            </label>
            <select
              id="focus-subject-select"
              value={selectedSubjectId}
              onChange={(e) => onSubjectChange(e.target.value)}
              className={fieldClass}
              disabled={isPending}
            >
              {activeSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="focus-objective-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Study Objective / Goal (Optional)
            </label>
            <input
              id="focus-objective-input"
              type="text"
              maxLength={200}
              placeholder="e.g. Read chapters 3 and 4, complete problem set"
              value={objective}
              onChange={(e) => onObjectiveChange(e.target.value)}
              className={fieldClass}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Mode Selector Tabs */}
        {canUsePomodoro ? (
          <div>
            <div className="flex rounded-lg border border-border/60 bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => onModeChange("pomodoro")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  mode === "pomodoro"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pomodoro
              </button>
              <button
                type="button"
                onClick={() => onModeChange("stopwatch")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  mode === "stopwatch"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Stopwatch
              </button>
            </div>
          </div>
        ) : null}

        {/* Pomodoro Presets (if in Pomodoro mode) */}
        {mode === "pomodoro" && canUsePomodoro && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interval Preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              {POMODORO_PRESETS.map((p) => {
                const isSelected = selectedPresetId === p.id && !showCustom;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setShowCustom(false);
                      onPresetChange(p.id);
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-500/80 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/30"
                        : "border-border/60 bg-card/60 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <span className="text-xs font-bold">{p.name}</span>
                    <span className="text-[11px] opacity-75 mt-0.5">{p.focusMinutes} / {p.breakMinutes}m</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCustom(!showCustom);
                  if (!showCustom) onPresetChange("custom");
                }}
                className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
              >
                {showCustom ? "Use standard presets" : "Custom intervals…"}
              </button>
            </div>

            {showCustom && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-border/50 bg-card/40 animate-in fade-in">
                <div>
                  <label htmlFor="custom-focus-minutes" className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Focus (Minutes)
                  </label>
                  <input
                    id="custom-focus-minutes"
                    type="number"
                    min={1}
                    max={180}
                    value={customFocusMinutes}
                    onChange={(e) => onCustomFocusMinutesChange(Math.max(1, parseInt(e.target.value) || 25))}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="custom-break-minutes" className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Break (Minutes)
                  </label>
                  <input
                    id="custom-break-minutes"
                    type="number"
                    min={1}
                    max={60}
                    value={customBreakMinutes}
                    onChange={(e) => onCustomBreakMinutesChange(Math.max(1, parseInt(e.target.value) || 5))}
                    className={fieldClass}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Start Button */}
        <div className="pt-2">
          {mode === "pomodoro" && canUsePomodoro ? (
            <Button
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-md"
              disabled={isPending || !selectedSubjectId}
              onClick={onStartFocus}
            >
              <Play className="size-4 mr-2" aria-hidden="true" />
              Start Focus Session
            </Button>
          ) : (
            <Button
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-md"
              disabled={isPending || !selectedSubjectId}
              onClick={onStartStopwatch}
            >
              <Play className="size-4 mr-2" aria-hidden="true" />
              Start Stopwatch
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Active Timer Controls (Running or Paused)
  const isRunning = timer.status === "running";
  const phase = (timer.phase ?? "focus") as FocusPhase;
  const isBreak = phase === "short_break" || phase === "long_break";
  const cycles = timer.cycles_completed ?? 0;

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto">
      {/* Cycle indicator badges (Pomodoro mode only) */}
      {timer.mode === "pomodoro" && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-card/60 backdrop-blur-xs text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3 text-amber-500 shrink-0" aria-hidden="true" />
          <span>
            {cycles} {cycles === 1 ? "cycle" : "cycles"} completed
          </span>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="flex items-center gap-3">
        {isRunning ? (
          <Button
            size="lg"
            variant="outline"
            disabled={isPending}
            onClick={onPause}
            className="h-12 px-6 rounded-full font-semibold border-border/80 shadow-sm cursor-pointer"
            aria-label="Pause timer"
          >
            <Pause className="size-5 mr-2" aria-hidden="true" /> Pause
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={isPending}
            onClick={onResume}
            className="h-12 px-6 rounded-full font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
            aria-label="Resume timer"
          >
            <Play className="size-5 mr-2" aria-hidden="true" /> Resume
          </Button>
        )}

        {isBreak && (
          <Button
            size="lg"
            variant="outline"
            disabled={isPending}
            onClick={onSkipBreak}
            className="h-12 px-5 rounded-full font-semibold border-teal-500/40 text-teal-400 hover:bg-teal-500/10 cursor-pointer"
            aria-label="Skip break and start next focus phase"
          >
            <FastForward className="size-4 mr-2" aria-hidden="true" /> Skip Break
          </Button>
        )}

        <Button
          size="lg"
          variant="secondary"
          disabled={isPending}
          onClick={onStop}
          className="h-12 px-5 rounded-full font-semibold cursor-pointer"
          aria-label="End session and review summary"
        >
          <Square className="size-4 mr-2" aria-hidden="true" /> End Session
        </Button>
      </div>
    </div>
  );
}
