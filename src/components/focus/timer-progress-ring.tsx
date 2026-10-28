"use client";

import React from "react";
import type { FocusPhase } from "@/lib/focus/timer";

interface TimerProgressRingProps {
  progress: number; // 0 to 1
  phase: FocusPhase;
  status: "running" | "paused" | "stopped";
  children: React.ReactNode;
  size?: number;
  strokeWidth?: number;
}

export function TimerProgressRing({
  progress,
  phase,
  status,
  children,
  size = 320,
  strokeWidth = 10,
}: TimerProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Clamped progress between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference - clampedProgress * circumference;

  const isBreak = phase === "short_break" || phase === "long_break";
  const isRunning = status === "running";

  // Color selection based on phase
  const ringColor = isBreak ? "var(--color-teal-500, #14b8a6)" : "var(--color-emerald-500, #10b981)";
  const glowColor = isBreak ? "rgba(20, 184, 166, 0.2)" : "rgba(16, 185, 129, 0.2)";

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="rotate-[-90deg] transform"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30 transition-colors"
        />

        {/* Animated active progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset] duration-700 ease-linear motion-reduce:transition-none"
          style={{
            filter: isRunning ? `drop-shadow(0 0 10px ${glowColor})` : "none",
          }}
        />
      </svg>

      {/* Center content slot */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        {children}
      </div>
    </div>
  );
}
