/**
 * Pure Focus Mode calculations, phase transitions, and validations.
 * Note: Uses strict relative imports and standard ES/Node primitives so it can be executed
 * directly by Node's test runner without aliases.
 */

export type FocusMode = "stopwatch" | "pomodoro";
export type FocusPhase = "focus" | "short_break" | "long_break";

export interface FocusConfig {
  focusDurationMs: number;
  shortBreakMs: number;
  longBreakMs: number;
  longBreakEvery: number; // 0 disables long break, otherwise 2..12
}

export const DEFAULT_FOCUS_CONFIG: FocusConfig = {
  focusDurationMs: 25 * 60 * 1000,
  shortBreakMs: 5 * 60 * 1000,
  longBreakMs: 15 * 60 * 1000,
  longBreakEvery: 4,
};

/**
 * Calculates credited focus time and phase time, strictly capping elapsed focus time
 * to the scheduled phase duration so background/closed tabs cannot accumulate false focus hours.
 */
export function calculateFocusProgress({
  status,
  mode,
  phase,
  accumulatedMs,
  phaseAccumulatedMs,
  phaseDurationMs,
  segmentStartedAt,
  serverNowMs,
}: {
  status: "running" | "paused" | "stopped";
  mode: FocusMode;
  phase: FocusPhase;
  accumulatedMs: number;
  phaseAccumulatedMs: number;
  phaseDurationMs: number | null;
  segmentStartedAt: string | null;
  serverNowMs: number;
}) {
  const isRunning = status === "running" && segmentStartedAt !== null;
  const rawSegmentElapsed = isRunning ? Math.max(0, serverNowMs - Date.parse(segmentStartedAt)) : 0;

  if (mode !== "pomodoro" || phaseDurationMs === null) {
    // Stopwatch or standard timer mode: no cap
    return {
      totalElapsedMs: accumulatedMs + rawSegmentElapsed,
      phaseElapsedMs: rawSegmentElapsed,
      phaseRemainingMs: 0,
      isCapReached: false,
    };
  }

  if (phase === "focus") {
    const remainingInPhase = Math.max(0, phaseDurationMs - phaseAccumulatedMs);
    const creditedSegment = Math.min(rawSegmentElapsed, remainingInPhase);
    const currentPhaseElapsed = phaseAccumulatedMs + creditedSegment;
    const isCapReached = currentPhaseElapsed >= phaseDurationMs;

    return {
      totalElapsedMs: accumulatedMs + creditedSegment,
      phaseElapsedMs: currentPhaseElapsed,
      phaseRemainingMs: Math.max(0, phaseDurationMs - currentPhaseElapsed),
      isCapReached,
    };
  }

  // During breaks (short_break or long_break):
  // Breaks are paused on the database timer (accumulatedMs does not increase)
  const breakElapsed = isRunning ? rawSegmentElapsed : phaseAccumulatedMs;
  const isCapReached = breakElapsed >= phaseDurationMs;

  return {
    totalElapsedMs: accumulatedMs,
    phaseElapsedMs: Math.min(breakElapsed, phaseDurationMs),
    phaseRemainingMs: Math.max(0, phaseDurationMs - breakElapsed),
    isCapReached,
  };
}

/**
 * Determines the next phase and cycle increment based on completed focus cycles and settings.
 */
export function getNextPomodoroPhase({
  currentPhase,
  cyclesCompleted,
  longBreakEvery,
  wasFocusCompletedFullDuration,
}: {
  currentPhase: FocusPhase;
  cyclesCompleted: number;
  longBreakEvery: number;
  wasFocusCompletedFullDuration: boolean;
}): {
  nextPhase: FocusPhase;
  newCyclesCompleted: number;
  isLongBreak: boolean;
} {
  if (currentPhase === "focus") {
    const newCycles = wasFocusCompletedFullDuration ? cyclesCompleted + 1 : cyclesCompleted;
    const isLongBreak = longBreakEvery > 0 && newCycles > 0 && newCycles % longBreakEvery === 0;

    return {
      nextPhase: isLongBreak ? "long_break" : "short_break",
      newCyclesCompleted: newCycles,
      isLongBreak,
    };
  }

  // Transitioning from break back to focus
  return {
    nextPhase: "focus",
    newCyclesCompleted: cyclesCompleted,
    isLongBreak: false,
  };
}

/**
 * Validates a Spotify playlist identifier or URL and extracts the 22-character base62 ID.
 */
const SPOTIFY_ID_REGEX = /^[0-9A-Za-z]{22}$/;
const SPOTIFY_URL_REGEX = /open\.spotify\.com\/playlist\/([0-9A-Za-z]{22})/;

export function parseSpotifyPlaylistId(input: string): { isValid: boolean; playlistId: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { isValid: false, playlistId: null };

  if (SPOTIFY_ID_REGEX.test(trimmed)) {
    return { isValid: true, playlistId: trimmed };
  }

  const match = trimmed.match(SPOTIFY_URL_REGEX);
  if (match && match[1]) {
    return { isValid: true, playlistId: match[1] };
  }

  return { isValid: false, playlistId: null };
}

/**
 * Categorizes local time of day for ambient/playlist mood recommendations.
 * - Morning: 05:00 - 11:59
 * - Afternoon: 12:00 - 17:59
 * - Night: 18:00 - 04:59
 */
export function getTimeOfDayCategory(hour: number): "morning" | "afternoon" | "night" {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "night";
}
