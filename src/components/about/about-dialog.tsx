"use client";

import * as React from "react";
import Image from "next/image";
import {
  Sparkles,
  Github,
  Globe,
  ExternalLink,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Workflow,
  Code2,
  User,
  Heart,
  Timer,
  Zap,
  Music,
  ArrowRight,
} from "lucide-react";
import { cn } from "cn";
import { TiltCard } from "./tilt-card";
import { ProcessFlowchart } from "./process-flowchart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type AboutSection = "overview" | "process" | "creator";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const [activeSection, setActiveSection] = React.useState<AboutSection>("overview");

  // Keyboard navigation for quick section switching
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") setActiveSection("overview");
      if (e.key === "2") setActiveSection("process");
      if (e.key === "3") setActiveSection("creator");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-hidden p-0 sm:max-w-4xl border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl">
        {/* Ambient Top Glow Line */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 shadow-[0_0_20px_rgba(45,212,191,0.5)]"
        />

        {/* Dialog Header */}
        <DialogHeader className="border-b border-border/60 px-6 pt-6 pb-4 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div
                aria-hidden
                className="relative grid size-11 place-items-center overflow-hidden rounded-xl bg-[#0d1417] shadow-md ring-1 ring-emerald-500/30"
              >
                <Image
                  src="/logo-icon.png"
                  alt="Study Tracker Emblem"
                  width={44}
                  height={44}
                  className="size-full object-contain p-1"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Project AI Study Tracker
                  </DialogTitle>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-emerald-400">
                    v0.0.1
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground sm:text-sm">
                  Full-stack distraction-free focus environment with server-authoritative telemetry & adaptive AI planning.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* 3 Clickable Command Navigation Sections */}
          <nav
            aria-label="About the App Sections"
            className="mt-4 flex rounded-xl border border-border/70 bg-secondary/60 p-1 backdrop-blur-xs"
          >
            <button
              type="button"
              onClick={() => setActiveSection("overview")}
              className={cn(
                "group relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all duration-200 cursor-pointer sm:text-sm",
                activeSection === "overview"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/80"
                  : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
              )}
            >
              <Sparkles
                className={cn(
                  "size-4 transition-colors",
                  activeSection === "overview" ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )}
              />
              <span>01 · Overview</span>
              {activeSection === "overview" && (
                <span className="absolute bottom-0 inset-x-4 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(45,212,191,0.7)]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("process")}
              className={cn(
                "group relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all duration-200 cursor-pointer sm:text-sm",
                activeSection === "process"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/80"
                  : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
              )}
            >
              <Workflow
                className={cn(
                  "size-4 transition-colors",
                  activeSection === "process" ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )}
              />
              <span>02 · Process & Stack</span>
              {activeSection === "process" && (
                <span className="absolute bottom-0 inset-x-4 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(45,212,191,0.7)]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("creator")}
              className={cn(
                "group relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all duration-200 cursor-pointer sm:text-sm",
                activeSection === "creator"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/80"
                  : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
              )}
            >
              <User
                className={cn(
                  "size-4 transition-colors",
                  activeSection === "creator" ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )}
              />
              <span>03 · Creator & Links</span>
              {activeSection === "creator" && (
                <span className="absolute bottom-0 inset-x-4 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(45,212,191,0.7)]" />
              )}
            </button>
          </nav>
        </DialogHeader>

        {/* Scrollable Content Container with Seamless Tab Transitions */}
        <div className="relative max-h-[calc(85vh-170px)] overflow-y-auto px-6 py-6 sm:px-8 custom-scrollbar">
          {/* ========================================================================= */}
          {/* SECTION 1: OVERVIEW */}
          {/* ========================================================================= */}
          {activeSection === "overview" && (
            <div className="animate-in fade-in-50 zoom-in-[0.98] duration-300 space-y-6">
              {/* 3D Interactive Hero Tilt Card */}
              <TiltCard maxTilt={6} className="w-full">
                <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-accent/20 p-6 sm:p-8 shadow-lg">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/10 blur-3xl"
                  />

                  <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3 max-w-xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <Sparkles className="size-3.5" /> Intentional Learning Ecosystem
                      </div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                        Track study time with integrity. Plan with intelligence.
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                        Project AI Study Tracker bridges the gap between raw stopwatch timers and practical productivity. Built with a server-authoritative PostgreSQL clock, procedural Web Audio soundscapes, and adaptive AI planning that only ever builds from what you actually accomplish.
                      </p>
                    </div>

                    {/* Floating 3D Emblem Container */}
                    <div
                      style={{ transform: "translateZ(30px)" }}
                      className="relative mx-auto flex size-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#18282b] to-[#0c1416] p-2 ring-1 ring-emerald-500/40 shadow-[0_15px_30px_-5px_rgba(13,122,110,0.4)] transition-transform duration-300 hover:scale-105"
                    >
                      <Image
                        src="/logo.png"
                        alt="Project AI Study Tracker Logo"
                        width={96}
                        height={96}
                        className="size-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                        priority
                      />
                    </div>
                  </div>

                  {/* 3D Parallax Floating Stat Grid */}
                  <div
                    style={{ transform: "translateZ(20px)" }}
                    className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-5 sm:grid-cols-4"
                  >
                    <div className="rounded-xl border border-border/60 bg-secondary/50 p-3">
                      <div className="font-mono text-xs text-muted-foreground uppercase">Clock Authority</div>
                      <div className="mt-0.5 text-base font-bold text-foreground">Postgres Server</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-secondary/50 p-3">
                      <div className="font-mono text-xs text-muted-foreground uppercase">Multi-Device</div>
                      <div className="mt-0.5 text-base font-bold text-foreground">Realtime WS</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-secondary/50 p-3">
                      <div className="font-mono text-xs text-muted-foreground uppercase">Audio Assets</div>
                      <div className="mt-0.5 text-base font-bold text-foreground">0 KB (Procedural)</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-secondary/50 p-3">
                      <div className="font-mono text-xs text-muted-foreground uppercase">AI Generation</div>
                      <div className="mt-0.5 text-base font-bold text-foreground">Vercel AI SDK</div>
                    </div>
                  </div>
                </div>
              </TiltCard>

              {/* 4 Core Pillars Matrix */}
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-primary/40 hover:bg-card/90">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Timer className="size-4.5" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">Focus Mode & Pomodoro</h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Distraction-free arena featuring Classic (25/5), Extended (50/10), and Deep Work (90/15) presets with smooth SVG progress rings and server-enforced duration caps.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-primary/40 hover:bg-card/90">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-teal-500/10 text-teal-400">
                      <Music className="size-4.5" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">Circadian Audio Dock</h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Native Web Audio synthesis for Brown Noise, Rain, and White Noise offline, plus circadian Spotify playlist recommendations matched to your local device time.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-primary/40 hover:bg-card/90">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Zap className="size-4.5" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">Floating Live Companion</h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Live ticking emblem button in the bottom corner of your dashboard that expands into a quick-control mini-dock without breaking your workflow.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-primary/40 hover:bg-card/90">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <ShieldCheck className="size-4.5" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">Server Concurrency Safety</h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    PostgreSQL row locks (`FOR UPDATE`) and timestamp validation ensure multi-tab race conditions and closed-laptop sleeps never corrupt your session data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: PROCESS, WHO IT'S FOR & TECH STACK */}
          {/* ========================================================================= */}
          {activeSection === "process" && (
            <div className="animate-in fade-in-50 zoom-in-[0.98] duration-300 space-y-7">
              {/* Short Description & Audience */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary">
                    Project Vision
                  </span>
                  <h4 className="mt-1 text-base font-bold text-foreground">About the Project</h4>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    Project AI Study Tracker is an end-to-end productivity engine created to eliminate guesswork from learning. It pairs high-aesthetic study timers with genuine mathematical time reconciliation, historical analytics, and realistic AI weekly planning.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-teal-400">
                    Target Learners
                  </span>
                  <h4 className="mt-1 text-base font-bold text-foreground">Who It&rsquo;s For</h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground sm:text-sm">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="size-4 shrink-0 text-primary mt-0.5" />
                      <span>Students preparing for exams, university courses, and certifications.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="size-4 shrink-0 text-primary mt-0.5" />
                      <span>Software engineers, designers, and self-directed deep work practitioners.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="size-4 shrink-0 text-primary mt-0.5" />
                      <span>Anyone tired of fake timers that inflate hours when your laptop goes to sleep.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* The Process Behind It: Interactive Flowchart */}
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5 sm:p-6">
                <ProcessFlowchart />
              </div>

              {/* Tech Stack 3D Interactive Badge Grid */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Code2 className="size-4.5 text-primary" />
                  <h4 className="text-sm font-semibold tracking-wide uppercase text-foreground">
                    Comprehensive Tech Stack
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {[
                    { name: "Next.js 15 (App Router)", cat: "Frontend Framework", desc: "React Server Components & streaming" },
                    { name: "React 19 & TypeScript", cat: "Client Runtime", desc: "Strict type safety & optimistic state" },
                    { name: "Tailwind CSS v4", cat: "Styling & Design Tokens", desc: "Emerald / teal palette & glassmorphism" },
                    { name: "Supabase PostgreSQL", cat: "Database & Security Definer", desc: "Atomic timer RPCs & strict RLS" },
                    { name: "Supabase Realtime", cat: "Multi-Device Sync", desc: "WebSocket subscription & multi-tab bus" },
                    { name: "Web Audio API", cat: "Procedural Synthesis", desc: "Zero-asset Brownian, rain & white noise" },
                    { name: "Spotify iFrame API", cat: "Circadian Music", desc: "Time-of-day study playlist curation" },
                    { name: "Vercel AI SDK", cat: "Adaptive Intelligence", desc: "LLM weekly plan generation" },
                    { name: "Recharts & date-fns", cat: "Analytics & Heatmaps", desc: "Session trends & timezone alignment" },
                  ].map((tech) => (
                    <div
                      key={tech.name}
                      className="group rounded-xl border border-border/70 bg-card p-3 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md"
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">
                        {tech.cat}
                      </div>
                      <div className="mt-1 font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                        {tech.name}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                        {tech.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: CREATOR & LINKS */}
          {/* ========================================================================= */}
          {activeSection === "creator" && (
            <div className="animate-in fade-in-50 zoom-in-[0.98] duration-300 space-y-6">
              {/* 3D Interactive Creator Profile Card */}
              <TiltCard maxTilt={7} className="w-full">
                <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-accent/25 p-6 sm:p-8 shadow-xl">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 -left-20 size-60 rounded-full bg-teal-500/10 blur-3xl"
                  />

                  <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4 sm:gap-5">
                      {/* Avatar Badge with 3D Depth */}
                      <div
                        style={{ transform: "translateZ(25px)" }}
                        className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/30 font-mono text-2xl font-black text-primary ring-2 ring-primary/40 shadow-md sm:size-20 sm:text-3xl"
                      >
                        AI
                        <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card" />
                      </div>

                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          <User className="size-3.5" /> Project Creator & Lead Engineer
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                          Alex Ierasdain
                        </h3>
                        <p className="font-mono text-xs text-muted-foreground sm:text-sm">
                          @Alexhzier · Software Craftsman & Full-Stack Builder
                        </p>
                      </div>
                    </div>

                    <div className="self-start md:self-auto">
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                        <Heart className="size-3.5 fill-emerald-400/20" /> Open Source Advocate
                      </span>
                    </div>
                  </div>

                  <p className="relative z-10 mt-5 text-xs leading-relaxed text-muted-foreground sm:text-sm max-w-2xl">
                    Dedicated to designing robust, resilient distributed software with obsessively refined user interfaces. Project AI Study Tracker is crafted as a showcase of server-authoritative timekeeping, zero-dependency browser synthesis, and practical AI tooling that puts learner autonomy first.
                  </p>

                  <div
                    style={{ transform: "translateZ(15px)" }}
                    className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4"
                  >
                    {["Next.js 15", "TypeScript", "Supabase", "PostgreSQL", "Web Audio API", "Tailwind CSS", "Vercel AI SDK"].map((badge) => (
                      <span
                        key={badge}
                        className="rounded-lg border border-border/70 bg-secondary/70 px-2.5 py-1 font-mono text-[11px] font-medium text-foreground shadow-2xs"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </TiltCard>

              {/* Creator Action Links */}
              <div className="grid gap-3.5 sm:grid-cols-3">
                {/* GitHub Repository */}
                <a
                  href="https://github.com/Alexhzier/AI-Study-Tracker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="grid size-9 place-items-center rounded-lg bg-secondary text-foreground group-hover:text-primary transition-colors">
                        <Github className="size-5" />
                      </div>
                      <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      GitHub Repository
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Explore the complete source code, PostgreSQL migrations, and unit test suites.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 font-mono text-[11px] font-semibold text-primary">
                    <span>View Repository</span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>

                {/* GitHub Profile */}
                <a
                  href="https://github.com/Alexhzier"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="grid size-9 place-items-center rounded-lg bg-secondary text-foreground group-hover:text-primary transition-colors">
                        <User className="size-5" />
                      </div>
                      <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      GitHub Profile
                    </div>
                    <p className="text-xs text-muted-foreground">
                      View Alex&rsquo;s other open source projects, developer contributions, and code repositories.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 font-mono text-[11px] font-semibold text-primary">
                    <span>@Alexhzier</span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>

                {/* Creator Portfolio */}
                <a
                  href="https://github.com/Alexhzier"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="grid size-9 place-items-center rounded-lg bg-secondary text-foreground group-hover:text-primary transition-colors">
                        <Globe className="size-5" />
                      </div>
                      <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      Developer Portfolio
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Software engineering portfolio, system design case studies, and live production demos.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 font-mono text-[11px] font-semibold text-primary">
                    <span>Visit Portfolio</span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              </div>

              {/* Direct Inquiries & Contact Banner */}
              <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-secondary/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="size-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Direct Inquiries & Collaboration</div>
                    <div className="font-mono text-xs text-muted-foreground">alexierasdain321@gmail.com</div>
                  </div>
                </div>
                <a
                  href="mailto:alexierasdain321@gmail.com"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  Send Message
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Dialog Footer with Navigation Helper */}
        <div className="flex items-center justify-between border-t border-border/60 bg-secondary/40 px-6 py-3 text-xs text-muted-foreground sm:px-8">
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[11px] sm:inline">Shortcuts: Press 1, 2, or 3 to switch tabs</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border/80 bg-card px-3 py-1 font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

