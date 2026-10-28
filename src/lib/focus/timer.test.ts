import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateFocusProgress,
  getNextPomodoroPhase,
  getTimeOfDayCategory,
  parseSpotifyPlaylistId,
} from "./timer.ts";

test("calculateFocusProgress: stopwatch mode counts uncapped elapsed time", () => {
  const startedAt = "2026-10-28T00:00:00.000Z";
  const now = Date.parse(startedAt) + 120_000; // 2 minutes later

  const progress = calculateFocusProgress({
    status: "running",
    mode: "stopwatch",
    phase: "focus",
    accumulatedMs: 60_000,
    phaseAccumulatedMs: 0,
    phaseDurationMs: null,
    segmentStartedAt: startedAt,
    serverNowMs: now,
  });

  assert.equal(progress.totalElapsedMs, 180_000);
  assert.equal(progress.isCapReached, false);
});

test("calculateFocusProgress: focus phase strictly caps credited time to duration", () => {
  const durationMs = 25 * 60 * 1000; // 25 minutes
  const startedAt = "2026-10-28T00:00:00.000Z";
  // Simulate client sleeping or tab disconnected for 3 hours (180 minutes)
  const now = Date.parse(startedAt) + 180 * 60 * 1000;

  const progress = calculateFocusProgress({
    status: "running",
    mode: "pomodoro",
    phase: "focus",
    accumulatedMs: 0,
    phaseAccumulatedMs: 0,
    phaseDurationMs: durationMs,
    segmentStartedAt: startedAt,
    serverNowMs: now,
  });

  // Credited time must be capped at 25 minutes (1,500,000 ms), NOT 3 hours!
  assert.equal(progress.totalElapsedMs, durationMs);
  assert.equal(progress.phaseElapsedMs, durationMs);
  assert.equal(progress.phaseRemainingMs, 0);
  assert.equal(progress.isCapReached, true);
});

test("calculateFocusProgress: multiple paused stretches within focus phase cap accurately", () => {
  const durationMs = 25 * 60 * 1000;
  // User previously accumulated 20 minutes in this phase
  const phaseAccumulatedMs = 20 * 60 * 1000;
  const startedAt = "2026-10-28T00:00:00.000Z";
  // Running for 10 minutes (exceeds remaining 5 minutes)
  const now = Date.parse(startedAt) + 10 * 60 * 1000;

  const progress = calculateFocusProgress({
    status: "running",
    mode: "pomodoro",
    phase: "focus",
    accumulatedMs: 20 * 60 * 1000,
    phaseAccumulatedMs,
    phaseDurationMs: durationMs,
    segmentStartedAt: startedAt,
    serverNowMs: now,
  });

  // Total should be 20 min + 5 remaining min = 25 minutes
  assert.equal(progress.totalElapsedMs, durationMs);
  assert.equal(progress.phaseElapsedMs, durationMs);
  assert.equal(progress.phaseRemainingMs, 0);
  assert.equal(progress.isCapReached, true);
});

test("calculateFocusProgress: break phases never increment accumulated focus time", () => {
  const durationMs = 5 * 60 * 1000; // 5 min break
  const previousFocusMs = 25 * 60 * 1000;

  const progress = calculateFocusProgress({
    status: "paused",
    mode: "pomodoro",
    phase: "short_break",
    accumulatedMs: previousFocusMs,
    phaseAccumulatedMs: 0,
    phaseDurationMs: durationMs,
    segmentStartedAt: null,
    serverNowMs: Date.now(),
  });

  assert.equal(progress.totalElapsedMs, previousFocusMs);
  assert.equal(progress.phaseRemainingMs, durationMs);
});

test("getNextPomodoroPhase: regular cycle leads to short_break", () => {
  const result = getNextPomodoroPhase({
    currentPhase: "focus",
    cyclesCompleted: 0,
    longBreakEvery: 4,
    wasFocusCompletedFullDuration: true,
  });

  assert.equal(result.nextPhase, "short_break");
  assert.equal(result.newCyclesCompleted, 1);
  assert.equal(result.isLongBreak, false);
});

test("getNextPomodoroPhase: 4th completed cycle triggers long_break", () => {
  const result = getNextPomodoroPhase({
    currentPhase: "focus",
    cyclesCompleted: 3,
    longBreakEvery: 4,
    wasFocusCompletedFullDuration: true,
  });

  assert.equal(result.nextPhase, "long_break");
  assert.equal(result.newCyclesCompleted, 4);
  assert.equal(result.isLongBreak, true);
});

test("getNextPomodoroPhase: early termination does not award completed cycle", () => {
  const result = getNextPomodoroPhase({
    currentPhase: "focus",
    cyclesCompleted: 2,
    longBreakEvery: 4,
    wasFocusCompletedFullDuration: false,
  });

  assert.equal(result.newCyclesCompleted, 2);
});

test("getNextPomodoroPhase: disabled long break (longBreakEvery = 0) stays short_break", () => {
  const result = getNextPomodoroPhase({
    currentPhase: "focus",
    cyclesCompleted: 3,
    longBreakEvery: 0,
    wasFocusCompletedFullDuration: true,
  });

  assert.equal(result.nextPhase, "short_break");
  assert.equal(result.newCyclesCompleted, 4);
  assert.equal(result.isLongBreak, false);
});

test("parseSpotifyPlaylistId: parses 22-char IDs and full playlist URLs", () => {
  const validId = "37i9dQZF1DX8Uebhn9wzrS";
  assert.deepEqual(parseSpotifyPlaylistId(validId), { isValid: true, playlistId: validId });

  const validUrl = `https://open.spotify.com/playlist/${validId}?si=abcdef`;
  assert.deepEqual(parseSpotifyPlaylistId(validUrl), { isValid: true, playlistId: validId });

  assert.equal(parseSpotifyPlaylistId("invalid-id").isValid, false);
  assert.equal(parseSpotifyPlaylistId("").isValid, false);
  assert.equal(parseSpotifyPlaylistId("https://youtube.com/watch?v=123").isValid, false);
});

test("getTimeOfDayCategory: accurate circadian boundaries", () => {
  assert.equal(getTimeOfDayCategory(4), "night");
  assert.equal(getTimeOfDayCategory(5), "morning");
  assert.equal(getTimeOfDayCategory(11), "morning");
  assert.equal(getTimeOfDayCategory(12), "afternoon");
  assert.equal(getTimeOfDayCategory(17), "afternoon");
  assert.equal(getTimeOfDayCategory(18), "night");
  assert.equal(getTimeOfDayCategory(23), "night");
  assert.equal(getTimeOfDayCategory(0), "night");
});
