"use client";

import { AlertCircle, Bell, BellOff } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  timerFocusNextPhase,
  timerFocusSkipBreak,
  timerFocusStart,
  timerFocusUpdateObjective,
  timerPause,
  timerResume,
  timerStart,
  timerStop,
} from "@/actions/timer";
import { FocusHeader } from "@/components/focus/focus-header";
import { POMODORO_PRESETS, PomodoroControls } from "@/components/focus/pomodoro-controls";
import { SessionSummaryDialog } from "@/components/focus/session-summary-dialog";
import { TimerProgressRing } from "@/components/focus/timer-progress-ring";
import {
  calculateFocusProgress,
  type FocusMode,
  type FocusPhase,
} from "@/lib/focus/timer";
import { createClient } from "@/lib/supabase/client";
import { normalizeTimer, type TimerResult, type TimerRow } from "@/lib/timer";
import type { Subject } from "@/lib/types";

function formatDigitalClock(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const p = (n: number) => String(n).padStart(2, "0");

  if (hours > 0) {
    return `${p(hours)}:${p(minutes)}:${p(seconds)}`;
  }
  return `${p(minutes)}:${p(seconds)}`;
}

function playFocusChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(523.25, t); // C5
    gain1.gain.setValueAtTime(0.12, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.setValueAtTime(659.25, t + 0.12); // E5
    gain2.gain.setValueAtTime(0.12, t + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.12);
    osc2.stop(t + 0.7);
  } catch {
    // Audio autoplay restricted
  }
}

interface FocusArenaProps {
  subjects: Subject[];
  userId: string;
  initialCapabilities: { supported: boolean; version?: number };
}

export function FocusArena({ subjects, userId, initialCapabilities }: FocusArenaProps) {
  const supabase = useMemo(() => createClient(), []);
  const activeSubjects = useMemo(() => subjects.filter((s) => !s.is_archived), [subjects]);

  // Timer & synchronization state
  const [timer, setTimer] = useState<TimerRow | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [isReady, setIsReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // User configuration & local preferences
  const [selectedSubjectId, setSelectedSubjectId] = useState(activeSubjects[0]?.id ?? "");
  const [objective, setObjective] = useState("");
  const [mode, setMode] = useState<FocusMode>(initialCapabilities.supported ? "pomodoro" : "stopwatch");
  const [selectedPresetId, setSelectedPresetId] = useState("classic");
  const [customFocusMinutes, setCustomFocusMinutes] = useState(25);
  const [customBreakMinutes, setCustomBreakMinutes] = useState(5);
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);

  // Keep track of notified phase to prevent re-firing after refresh
  const lastNotifiedPhaseRef = useRef<string | null>(null);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`study-tracker:focus-prefs:v1:${userId}`);
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.mode && initialCapabilities.supported) setMode(prefs.mode);
        if (prefs.selectedPresetId) setSelectedPresetId(prefs.selectedPresetId);
        if (prefs.customFocusMinutes) setCustomFocusMinutes(prefs.customFocusMinutes);
        if (prefs.customBreakMinutes) setCustomBreakMinutes(prefs.customBreakMinutes);
      }
      if (typeof Notification !== "undefined") {
        setNotificationsAllowed(Notification.permission === "granted");
      }
    } catch (e) {
      console.warn("Could not load local focus preferences:", e);
    }
  }, [userId, initialCapabilities.supported]);

  // Save preferences to localStorage
  const savePreferences = useCallback(
    (overrides?: Partial<{ mode: FocusMode; presetId: string; focusMins: number; breakMins: number }>) => {
      try {
        const payload = {
          mode: overrides?.mode ?? mode,
          selectedPresetId: overrides?.presetId ?? selectedPresetId,
          customFocusMinutes: overrides?.focusMins ?? customFocusMinutes,
          customBreakMinutes: overrides?.breakMins ?? customBreakMinutes,
        };
        localStorage.setItem(`study-tracker:focus-prefs:v1:${userId}`, JSON.stringify(payload));
      } catch (e) {
        console.warn("Could not save local focus preferences:", e);
      }
    },
    [userId, mode, selectedPresetId, customFocusMinutes, customBreakMinutes],
  );

  // Reconcile authoritative timer state from server
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
      setIsReady(true);

      // Auto-open summary dialog if stopped timer exists
      if (normalized?.status === "stopped") {
        setIsSummaryOpen(true);
      }
    } catch (err) {
      console.error("Timer state reconciliation failed:", err);
      setIsReady(true);
    }
  }, [supabase]);

  // Realtime subscription and heartbeat polling
  useEffect(() => {
    refreshTimerState();

    const channel = supabase
      .channel(`active_timer:${userId}`)
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

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshTimerState();
      }
    };

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

  // Timer 1s tick effect when running
  useEffect(() => {
    if (timer?.status !== "running") return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer?.status]);

  // Calculate progress and time values
  const serverNowMs = now + serverOffset;
  const progress = calculateFocusProgress({
    status: timer?.status ?? "stopped",
    mode: timer?.mode ?? mode,
    phase: (timer?.phase ?? "focus") as FocusPhase,
    accumulatedMs: timer?.accumulated_ms ?? 0,
    phaseAccumulatedMs: timer?.phase_accumulated_ms ?? 0,
    phaseDurationMs: timer?.phase_duration_ms ?? null,
    segmentStartedAt: timer?.segment_started_at ?? null,
    serverNowMs,
  });

  // Automatic phase completion check for Pomodoro
  useEffect(() => {
    if (timer?.status !== "running" || timer?.mode !== "pomodoro" || !timer?.phase_started_at) return;

    if (progress.isCapReached) {
      const phaseKey = `${timer.phase}_${timer.phase_started_at}`;
      if (lastNotifiedPhaseRef.current !== phaseKey) {
        lastNotifiedPhaseRef.current = phaseKey;
        playFocusChime();

        if (notificationsAllowed && typeof Notification !== "undefined") {
          const isFocus = timer.phase === "focus";
          new Notification(isFocus ? "Focus phase completed!" : "Break finished!", {
            body: isFocus ? "Time to take a well-deserved break." : "Ready to focus again?",
            icon: "/favicon.ico",
          });
        }

        // Atomically transition phase on server with concurrency token
        startTransition(async () => {
          const res = await timerFocusNextPhase({
            expectedPhaseStartedAt: timer.phase_started_at!,
            autoStartFocus: false,
          });
          if (res.timer) setTimer(res.timer);
        });
      }
    }
  }, [progress.isCapReached, timer, notificationsAllowed]);

  // Server Action Wrappers
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

  const handleStartFocus = () => {
    if (!selectedSubjectId) {
      toast.error("Please select a subject.");
      return;
    }

    let focusMins = 25;
    let breakMins = 5;
    let longBreakMins = 15;

    if (selectedPresetId === "custom") {
      focusMins = customFocusMinutes;
      breakMins = customBreakMinutes;
    } else {
      const preset = POMODORO_PRESETS.find((p) => p.id === selectedPresetId);
      if (preset) {
        focusMins = preset.focusMinutes;
        breakMins = preset.breakMinutes;
        longBreakMins = preset.longBreakMinutes;
      }
    }

    savePreferences({ mode: "pomodoro", presetId: selectedPresetId, focusMins, breakMins });

    handleAction(() =>
      timerFocusStart({
        subjectId: selectedSubjectId,
        durationMinutes: focusMins,
        shortBreakMinutes: breakMins,
        longBreakMinutes: longBreakMins,
        longBreakEvery: 4,
        objective: objective.trim() || undefined,
      }),
    );
  };

  const handleStartStopwatch = () => {
    if (!selectedSubjectId) {
      toast.error("Please select a subject.");
      return;
    }
    savePreferences({ mode: "stopwatch" });
    handleAction(() => timerStart(selectedSubjectId));
  };

  const handlePause = () => handleAction(() => timerPause());
  const handleResume = () => handleAction(() => timerResume());
  const handleStop = () => {
    handleAction(() => timerStop(), () => setIsSummaryOpen(true));
  };

  const handleSkipBreak = () => {
    if (!timer?.phase_started_at) return;
    handleAction(() =>
      timerFocusSkipBreak({
        expectedPhaseStartedAt: timer.phase_started_at!,
        autoStartFocus: false,
      }),
    );
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const perm = await Notification.requestPermission();
      setNotificationsAllowed(perm === "granted");
      if (perm === "granted") toast.success("Focus notifications enabled!");
    } catch (e) {
      console.warn("Notification request failed:", e);
    }
  };

  const activeSubject = subjects.find((s) => s.id === (timer?.subject_id ?? selectedSubjectId));
  const isPomodoro = (timer?.mode ?? mode) === "pomodoro";
  const currentPhase = (timer?.phase ?? "focus") as FocusPhase;
  const isBreak = currentPhase === "short_break" || currentPhase === "long_break";

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div
          className="size-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"
          aria-label="Loading focus session…"
        />
      </div>
    );
  }

  // Calculate ring progress: 0 when starting, 1 when complete
  const ringProgress = timer?.phase_duration_ms
    ? progress.phaseElapsedMs / timer.phase_duration_ms
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors selection:bg-emerald-500/20">
      {/* Top Header */}
      <FocusHeader
        subject={activeSubject}
        objective={timer?.objective ?? (objective || null)}
        onEditObjective={() => {
          const newObj = prompt("Update your study objective:", timer?.objective ?? objective);
          if (newObj !== null) {
            setObjective(newObj);
            if (timer) {
              handleAction(() => timerFocusUpdateObjective(newObj));
            }
          }
        }}
      />

      {/* Migration Capability Warning Banner */}
      {!initialCapabilities.supported && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center text-xs text-amber-500 flex items-center justify-center gap-2">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>
            Database update required for full Pomodoro phase synchronization. Standard stopwatch mode is currently enabled.
          </span>
        </div>
      )}

      {/* Main Focus Arena */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-4xl mx-auto w-full">
        {/* Active Phase Pill Indicator */}
        {timer && timer.status !== "stopped" && isPomodoro && (
          <div className="mb-6 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                isBreak
                  ? "bg-teal-500/10 text-teal-400 border border-teal-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              <span
                className={`size-2 rounded-full animate-pulse ${
                  isBreak ? "bg-teal-400" : "bg-emerald-400"
                }`}
                aria-hidden="true"
              />
              {currentPhase === "short_break"
                ? "Short Break"
                : currentPhase === "long_break"
                ? "Long Break"
                : "Focus Phase"}
            </span>
          </div>
        )}

        {/* Center Timer Display & Progress Ring */}
        <div className="my-auto flex flex-col items-center justify-center py-4">
          {isPomodoro && timer && timer.status !== "stopped" ? (
            <TimerProgressRing
              progress={ringProgress}
              phase={currentPhase}
              status={timer.status}
              size={320}
              strokeWidth={12}
            >
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  {isBreak ? "Break Remaining" : "Time Remaining"}
                </span>
                <p
                  role="timer"
                  aria-live="polite"
                  className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight tabular-nums text-foreground drop-shadow-xs"
                >
                  {formatDigitalClock(progress.phaseRemainingMs)}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  Total focused: {formatDigitalClock(progress.totalElapsedMs)}
                </p>
              </div>
            </TimerProgressRing>
          ) : (
            <div className="text-center py-8">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold block mb-2">
                {timer && timer.status !== "stopped" ? "Elapsed Time" : "Focus Mode"}
              </span>
              <p
                role="timer"
                aria-live="polite"
                className="text-6xl sm:text-7xl font-extrabold font-mono tracking-tight tabular-nums text-foreground"
              >
                {timer && timer.status !== "stopped"
                  ? formatDigitalClock(progress.totalElapsedMs)
                  : formatDigitalClock(customFocusMinutes * 60 * 1000)}
              </p>
            </div>
          )}
        </div>

        {/* Action Controls & Presets Area */}
        <div className="w-full mt-6">
          <PomodoroControls
            timer={timer}
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            onSubjectChange={setSelectedSubjectId}
            objective={objective}
            onObjectiveChange={setObjective}
            mode={mode}
            onModeChange={(m) => {
              setMode(m);
              savePreferences({ mode: m });
            }}
            selectedPresetId={selectedPresetId}
            onPresetChange={(p) => {
              setSelectedPresetId(p);
              savePreferences({ presetId: p });
            }}
            customFocusMinutes={customFocusMinutes}
            onCustomFocusMinutesChange={(m) => {
              setCustomFocusMinutes(m);
              savePreferences({ focusMins: m });
            }}
            customBreakMinutes={customBreakMinutes}
            onCustomBreakMinutesChange={(m) => {
              setCustomBreakMinutes(m);
              savePreferences({ breakMins: m });
            }}
            onStartFocus={handleStartFocus}
            onStartStopwatch={handleStartStopwatch}
            onPause={handlePause}
            onResume={handleResume}
            onSkipBreak={handleSkipBreak}
            onStop={handleStop}
            isPending={isPending}
            canUsePomodoro={initialCapabilities.supported}
          />
        </div>
      </main>

      {/* Bottom Minimal Notification & Status Dock */}
      <footer className="w-full px-6 py-3 border-t border-border/40 bg-background/60 backdrop-blur-md flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {typeof Notification !== "undefined" && (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
              title={notificationsAllowed ? "Notifications enabled" : "Enable desktop chime notifications"}
            >
              {notificationsAllowed ? (
                <>
                  <Bell className="size-3.5 text-emerald-500" aria-hidden="true" />
                  <span className="hidden sm:inline">Chime alerts on</span>
                </>
              ) : (
                <>
                  <BellOff className="size-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Enable phase alerts</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="text-[11px] opacity-75">
          Distraction-Free Environment
        </div>
      </footer>

      {/* Session Completion Summary Dialog */}
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
    </div>
  );
}
