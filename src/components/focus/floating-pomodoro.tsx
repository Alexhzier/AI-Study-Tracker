"use client";

import {
  FastForward,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Sparkles,
  Square,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  timerFocusNextPhase,
  timerFocusSkipBreak,
  timerFocusStart,
  timerPause,
  timerResume,
  timerStop,
} from "@/actions/timer";
import { POMODORO_PRESETS } from "@/components/focus/pomodoro-controls";
import { SessionSummaryDialog } from "@/components/focus/session-summary-dialog";
import { calculateFocusProgress, type FocusPhase } from "@/lib/focus/timer";
import { createClient } from "@/lib/supabase/client";
import { normalizeTimer, type TimerResult, type TimerRow } from "@/lib/timer";
import type { Subject } from "@/lib/types";
import { fieldClass } from "@/lib/ui";

function formatClock(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(m)}:${p(s)}`;
}

function playFocusChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(523.25, t);
    gain1.gain.setValueAtTime(0.12, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.setValueAtTime(659.25, t + 0.12);
    gain2.gain.setValueAtTime(0.12, t + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.12);
    osc2.stop(t + 0.7);
  } catch {
    // Autoplay audio blocked
  }
}

interface FloatingPomodoroProps {
  userId: string;
  subjects: Subject[];
}

export function FloatingPomodoro({ userId, subjects = [] }: FloatingPomodoroProps) {
  const supabase = useMemo(() => createClient(), []);
  const activeSubjects = useMemo(() => (subjects ?? []).filter((s) => !s.is_archived), [subjects]);

  const [isOpen, setIsOpen] = useState(false);
  const [timer, setTimer] = useState<TimerRow | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [isPending, startTransition] = useTransition();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Setup form states
  const [selectedSubjectId, setSelectedSubjectId] = useState(activeSubjects[0]?.id ?? "");
  const [selectedPresetId, setSelectedPresetId] = useState("classic");

  // Reconcile timer state
  const refreshTimerState = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("timer_state");
      if (error || !data) return;
      const normalized = normalizeTimer(data.timer);
      setTimer(normalized);
      if (data.server_now) {
        setServerOffset(Number(data.server_now) - Date.now());
      }
      setNow(Date.now());
      if (normalized?.status === "stopped") {
        setIsSummaryOpen(true);
      }
    } catch (e) {
      console.error("Floating pomodoro timer sync failed:", e);
    }
  }, [supabase]);

  // Realtime subscription
  useEffect(() => {
    refreshTimerState();

    const channel = supabase
      .channel(`floating_active_timer:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "active_timers", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setTimer(null);
            setIsSummaryOpen(false);
          } else {
            const nextTimer = normalizeTimer(payload.new);
            setTimer(nextTimer);
            if (nextTimer?.status === "stopped") {
              setIsSummaryOpen(true);
            }
          }
        },
      )
      .subscribe();

    const onVisible = () => document.visibilityState === "visible" && refreshTimerState();
    const poll = setInterval(onVisible, 15_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [supabase, userId, refreshTimerState]);

  // Clock tick
  useEffect(() => {
    if (timer?.status !== "running") return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer?.status]);

  // Compute live progress
  const serverNowMs = now + serverOffset;
  const progress = calculateFocusProgress({
    status: timer?.status ?? "stopped",
    mode: timer?.mode ?? "pomodoro",
    phase: (timer?.phase ?? "focus") as FocusPhase,
    accumulatedMs: timer?.accumulated_ms ?? 0,
    phaseAccumulatedMs: timer?.phase_accumulated_ms ?? 0,
    phaseDurationMs: timer?.phase_duration_ms ?? null,
    segmentStartedAt: timer?.segment_started_at ?? null,
    serverNowMs,
  });

  // Automatic phase completion check for Pomodoro
  const lastNotifiedPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (timer?.status !== "running" || timer?.mode !== "pomodoro" || !timer?.phase_started_at) return;

    if (progress.isCapReached) {
      const phaseKey = `${timer.phase}_${timer.phase_started_at}`;
      if (lastNotifiedPhaseRef.current !== phaseKey) {
        lastNotifiedPhaseRef.current = phaseKey;
        playFocusChime();
        startTransition(async () => {
          const res = await timerFocusNextPhase({
            expectedPhaseStartedAt: timer.phase_started_at!,
            autoStartFocus: false,
          });
          if (res.timer) setTimer(res.timer);
        });
      }
    }
  }, [progress.isCapReached, timer]);

  // Action helpers
  const handleAction = (action: () => Promise<TimerResult>, onSuccess?: () => void) => {
    startTransition(async () => {
      const res = await action();
      if (res.error) {
        toast.error(res.error);
        await refreshTimerState();
        return;
      }
      if (res.timer !== undefined) setTimer(res.timer);
      if (res.serverNow) setServerOffset(res.serverNow - Date.now());
      setNow(Date.now());
      onSuccess?.();
    });
  };

  const handleStart = () => {
    if (!selectedSubjectId) {
      toast.error("Please select a subject.");
      return;
    }
    const preset = POMODORO_PRESETS.find((p) => p.id === selectedPresetId) ?? POMODORO_PRESETS[0];
    handleAction(() =>
      timerFocusStart({
        subjectId: selectedSubjectId,
        durationMinutes: preset.focusMinutes,
        shortBreakMinutes: preset.breakMinutes,
        longBreakMinutes: preset.longBreakMinutes,
        longBreakEvery: 4,
      }),
    );
  };

  const handlePause = () => handleAction(() => timerPause());
  const handleResume = () => handleAction(() => timerResume());
  const handleStop = () => handleAction(() => timerStop(), () => setIsSummaryOpen(true));
  const handleSkipBreak = () => {
    if (!timer?.phase_started_at) return;
    handleAction(() =>
      timerFocusSkipBreak({
        expectedPhaseStartedAt: timer.phase_started_at!,
        autoStartFocus: false,
      }),
    );
  };

  const isRunning = timer?.status === "running";
  const isPaused = timer?.status === "paused";
  const isTimerActive = isRunning || isPaused;
  const isPomodoro = timer?.mode === "pomodoro";
  const currentPhase = (timer?.phase ?? "focus") as FocusPhase;
  const isBreak = currentPhase === "short_break" || currentPhase === "long_break";
  const activeSubject = subjects.find((s) => s.id === (timer?.subject_id ?? selectedSubjectId));
  const cycles = timer?.cycles_completed ?? 0;

  // Mini circular ring progress
  const ringProgress = timer?.phase_duration_ms
    ? progress.phaseElapsedMs / timer.phase_duration_ms
    : 0;
  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference - Math.min(Math.max(ringProgress, 0), 1) * circumference;

  return (
    <>
      {/* Expanded Floating Mini-Dock */}
      {isOpen && (
        <div
          role="region"
          aria-label="Floating Pomodoro Timer"
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-[320px] sm:w-[350px] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-4 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header with Title, Fullscreen Link, and Minimize Button */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="relative grid size-8 place-items-center overflow-hidden rounded-lg bg-[#0d1417] shadow-xs ring-1 ring-emerald-500/30">
                <Image
                  src="/logo-icon.png"
                  alt="Pomodoro Focus"
                  width={32}
                  height={32}
                  className="size-full object-contain p-0.5"
                />
              </span>
              <span className="text-sm font-bold tracking-tight text-foreground">
                Pomodoro Focus
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/focus"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
                title="Expand to Fullscreen Focus Mode"
                aria-label="Expand to Fullscreen Focus Mode"
              >
                <Maximize2 className="size-3.5" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors cursor-pointer"
                title="Minimize back to dashboard"
                aria-label="Minimize timer"
              >
                <Minimize2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Active Timer View */}
          {isTimerActive ? (
            <div className="space-y-4 py-1 text-center">
              {/* Subject pill */}
              <div className="flex items-center justify-center gap-2">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: activeSubject?.color ?? "#10b981" }}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold truncate max-w-[200px]">
                  {activeSubject?.name ?? "Study Session"}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    isBreak
                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {currentPhase === "short_break"
                    ? "Short Break"
                    : currentPhase === "long_break"
                    ? "Long Break"
                    : "Focus"}
                </span>
              </div>

              {/* Center SVG Ring & Time */}
              <div className="relative mx-auto size-28 flex items-center justify-center">
                <svg className="size-28 rotate-[-90deg]" aria-hidden="true">
                  <circle
                    cx="56"
                    cy="56"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-muted/30"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="38"
                    stroke={isBreak ? "#14b8a6" : "#10b981"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-[stroke-dashoffset] duration-700 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p
                    role="timer"
                    className="text-2xl font-extrabold font-mono tracking-tight tabular-nums text-foreground"
                  >
                    {isPomodoro
                      ? formatClock(progress.phaseRemainingMs)
                      : formatClock(progress.totalElapsedMs)}
                  </p>
                  {isPomodoro && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Sparkles className="size-2.5 text-amber-500" aria-hidden="true" />
                      {cycles} {cycles === 1 ? "cycle" : "cycles"}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {isRunning ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handlePause}
                    className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold rounded-lg border border-border/80 bg-card hover:bg-secondary transition-all cursor-pointer"
                  >
                    <Pause className="size-3.5" aria-hidden="true" /> Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleResume}
                    className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs"
                  >
                    <Play className="size-3.5" aria-hidden="true" /> Resume
                  </button>
                )}

                {isBreak && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSkipBreak}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-teal-500/40 text-teal-400 hover:bg-teal-500/10 transition-all cursor-pointer"
                  >
                    <FastForward className="size-3.5" aria-hidden="true" /> Skip
                  </button>
                )}

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleStop}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer"
                >
                  <Square className="size-3.5" aria-hidden="true" /> End
                </button>
              </div>
            </div>
          ) : (
            /* Setup / Idle View */
            <div className="space-y-3 py-1">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className={fieldClass}
                >
                  {activeSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Preset
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {POMODORO_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPresetId(p.id)}
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        selectedPresetId === p.id
                          ? "border-emerald-500 bg-emerald-500/10 text-foreground font-semibold"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <p className="text-[11px] leading-tight">{p.name}</p>
                      <p className="text-[10px] opacity-75">{p.focusMinutes}m</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isPending || !selectedSubjectId}
                onClick={handleStart}
                className="w-full mt-2 h-9 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-sm"
              >
                <Play className="size-3.5" aria-hidden="true" /> Start Pomodoro
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom-Right Logo Button / Live Timer Badge */}
      <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={
            isTimerActive
              ? `Pomodoro timer ${isRunning ? "running" : "paused"}: ${formatClock(
                  isPomodoro ? progress.phaseRemainingMs : progress.totalElapsedMs,
                )}. Click to expand.`
              : "Open Pomodoro Focus Companion"
          }
          className={`group flex items-center gap-3 rounded-full p-2.5 shadow-2xl transition-all duration-300 cursor-pointer active:scale-95 ${
            isTimerActive
              ? "bg-card/95 border border-emerald-500/50 text-foreground pl-2.5 pr-4 ring-2 ring-emerald-500/20 backdrop-blur-md"
              : "bg-primary text-primary-foreground hover:scale-105 shadow-primary/25 ring-2 ring-primary/30 pl-2 pr-4.5 py-2"
          }`}
        >
          {/* Logo Brand Emblem */}
          <span className="relative grid size-9 place-items-center overflow-hidden rounded-full bg-[#0d1417] shadow-md ring-1 ring-emerald-500/40 shrink-0">
            <Image
              src="/logo-icon.png"
              alt="Pomodoro Focus"
              width={36}
              height={36}
              className="size-full object-contain p-0.5"
            />
          </span>

          {/* If timer is active: Show live countdown and phase dot right in the button! */}
          {isTimerActive ? (
            <div className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  isRunning ? "animate-ping" : ""
                } ${isBreak ? "bg-teal-400" : "bg-emerald-500"}`}
                aria-hidden="true"
              />
              <span className="text-sm font-mono font-bold tabular-nums">
                {isPomodoro
                  ? formatClock(progress.phaseRemainingMs)
                  : formatClock(progress.totalElapsedMs)}
              </span>
            </div>
          ) : (
            <span className="text-sm font-bold tracking-wide">
              Focus
            </span>
          )}
        </button>
      </div>

      {/* Completion Summary Dialog (if finished in floating widget) */}
      <SessionSummaryDialog
        isOpen={isSummaryOpen}
        timer={timer}
        subject={activeSubject}
        onSaved={() => {
          setIsSummaryOpen(false);
          setTimer(null);
          refreshTimerState();
        }}
        onDiscarded={() => {
          setIsSummaryOpen(false);
          setTimer(null);
          refreshTimerState();
        }}
      />
    </>
  );
}
