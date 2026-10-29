"use client";

import * as React from "react";
import {
  Timer,
  Server,
  Radio,
  BarChart3,
  Sparkles,
  ArrowDown,
  ShieldCheck,
  CheckCircle2,
  Workflow,
  Cpu,
} from "lucide-react";
import { cn } from "cn";

interface FlowStep {
  number: string;
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  details: string[];
  color: string;
  accentBorder: string;
  accentBg: string;
  tech: string;
}

const FLOW_STEPS: FlowStep[] = [
  {
    number: "01",
    title: "Focus Sprint & Client Layer",
    badge: "Input & Media",
    icon: Timer,
    description: "Learner selects subject & objective, starts Pomodoro or Stopwatch with offline Web Audio synthesis or circadian Spotify embed.",
    details: ["SVG circular progress ring", "Offline Web Audio (Brown/Rain/White)", "Circadian time-of-day music dock"],
    color: "text-emerald-400",
    accentBorder: "border-emerald-500/30",
    accentBg: "bg-emerald-500/10",
    tech: "Next.js 15 · React 19 · Web Audio API",
  },
  {
    number: "02",
    title: "Server Clock & Atomic RPCs",
    badge: "Failsafe Engine",
    icon: Server,
    description: "Timer lifecycle runs via PostgreSQL Security Definer RPCs using server clock to cap durations and prevent inflation during sleep.",
    details: ["Duration cap: min(elapsed, remaining)", "Row-level lock prevents race conditions", "Zero client clock tampering"],
    color: "text-teal-400",
    accentBorder: "border-teal-500/30",
    accentBg: "bg-teal-500/10",
    tech: "Supabase PostgreSQL · RPCs · RLS",
  },
  {
    number: "03",
    title: "Realtime Multi-Device Bus",
    badge: "Instant Sync",
    icon: Radio,
    description: "Database changes broadcast across active WebSockets so phone, tablet, and desktop maintain synchronized countdowns.",
    details: ["Postgres Realtime publication", "Instant cross-tab phase transitions", "Automated 20s polling fallback"],
    color: "text-cyan-400",
    accentBorder: "border-cyan-500/30",
    accentBg: "bg-cyan-500/10",
    tech: "Supabase Realtime · WebSockets",
  },
  {
    number: "04",
    title: "Session History & Analytics",
    badge: "Aggregates",
    icon: BarChart3,
    description: "Atomic save writes duration, objective, and completed Pomodoro cycles. Computes daily calendar heatmaps and streak counters.",
    details: ["Break time strictly excluded from study", "Timezone-aware calendar aggregation", "Subject breakdown & confidence trends"],
    color: "text-emerald-400",
    accentBorder: "border-emerald-500/30",
    accentBg: "bg-emerald-500/10",
    tech: "Postgres Tables · Recharts · date-fns",
  },
  {
    number: "05",
    title: "Adaptive AI Study Planner",
    badge: "Intelligence",
    icon: Sparkles,
    description: "LLM synthesizes real session history, exam schedules, and user availability to generate an actionable, balanced weekly study plan.",
    details: ["Grounded strictly in verified study data", "Per-user usage metering & cooldowns", "Structured JSON validation"],
    color: "text-teal-300",
    accentBorder: "border-teal-400/30",
    accentBg: "bg-teal-500/10",
    tech: "Vercel AI SDK · Gemini / OpenAI",
  },
];

export function ProcessFlowchart() {
  const [activeStep, setActiveStep] = React.useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="size-4.5 text-primary" />
          <h4 className="text-sm font-semibold tracking-wide uppercase text-foreground">
            System Process & Data Flow Architecture
          </h4>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
          <Cpu className="size-3" /> 5-Stage Closed Feedback Loop
        </span>
      </div>

      {/* Step Flow Nodes */}
      <div className="relative grid gap-4 lg:gap-3">
        {FLOW_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStep === idx;

          return (
            <div key={step.number} className="group relative">
              <div
                onClick={() => setActiveStep(isSelected ? null : idx)}
                style={{
                  transformStyle: "preserve-3d",
                }}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-xl border bg-card/80 p-4 transition-all duration-300 backdrop-blur-xs",
                  step.accentBorder,
                  isSelected
                    ? "ring-2 ring-primary/50 shadow-[0_10px_25px_-5px_rgba(13,122,110,0.25)] translate-x-1"
                    : "hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card shadow-xs"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    {/* 3D Elevated Number Badge */}
                    <div
                      style={{ transform: "translateZ(15px)" }}
                      className={cn(
                        "relative flex size-10 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-bold shadow-xs transition-transform duration-300 group-hover:scale-105",
                        step.accentBg,
                        step.accentBorder,
                        step.color
                      )}
                    >
                      <Icon className="size-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          STAGE {step.number}
                        </span>
                        <span className="text-xs text-muted-foreground/50">·</span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {step.badge}
                        </span>
                      </div>
                      <h5 className="text-base font-semibold text-foreground">
                        {step.title}
                      </h5>
                      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Tech Tag */}
                  <div className="self-start sm:self-auto sm:text-right">
                    <span className="inline-flex rounded-lg border border-border/80 bg-secondary/80 px-2 py-1 font-mono text-[11px] font-medium text-muted-foreground">
                      {step.tech}
                    </span>
                  </div>
                </div>

                {/* Expanded Micro-Details */}
                <div className="mt-3.5 border-t border-border/50 pt-3">
                  <ul className="grid gap-2 sm:grid-cols-3">
                    {step.details.map((detail, dIdx) => (
                      <li
                        key={dIdx}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                        <span className="truncate">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Connecting Conduit Indicator between stages */}
              {idx < FLOW_STEPS.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/60">
                    <ArrowDown className="size-3.5 animate-bounce text-primary/70" />
                    <span>atomic data pipeline</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Architecture Guarantee Footer */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3.5 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="size-5 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            <strong className="font-semibold text-foreground">Guaranteed Data Integrity:</strong>{" "}
            Direct client database writes are revoked. All active state transitions run strictly on server-side PostgreSQL triggers, keeping your study statistics accurate across unexpected power loss, closed browser tabs, and sleep states.
          </p>
        </div>
      </div>
    </div>
  );
}

