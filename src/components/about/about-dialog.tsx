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
      <DialogContent className="max-h-[92vh] w-full max-w-4xl overflow-hidden p-0 sm:max-w-4xl border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl">
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
        <div className="relative max-h-[calc(90vh-175px)] overflow-y-auto px-6 py-6 sm:px-8 custom-scrollbar">
          {/* ========================================================================= */}
          {/* SECTION 1: OVERVIEW */}
          {/* ========================================================================= */}
          {activeSection === "overview" && (
            <div className="animate-in fade-in-50 zoom-in-[0.98] duration-300 space-y-6">
              {/* 3D Interactive Hero Tilt Card with Prominently Enlarged Logo */}
              <TiltCard maxTilt={6} className="w-full">
                <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-accent/20 p-6 sm:p-8 shadow-xl">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/15 blur-3xl"
                  />

                  <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3 max-w-lg">
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

                    {/* Prominently Enlarged 3D Glowing Emblem */}
                    <div
                      style={{ transform: "translateZ(35px)" }}
                      className="relative mx-auto flex size-36 sm:size-44 md:size-48 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#18282b] to-[#0c1416] p-3 ring-2 ring-emerald-500/50 shadow-[0_0_40px_rgba(45,212,191,0.35)] transition-transform duration-300 hover:scale-105"
                    >
                      <Image
                        src="/logo-icon.png"
                        alt="Project AI Study Tracker Official Emblem"
                        width={200}
                        height={200}
                        className="size-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]"
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
          {/* SECTION 2: PROCESS, WHO IT'S FOR & TECH STACK (WITH OFFICIAL LOGOS) */}
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

              {/* Tech Stack 3D Interactive Badge Grid with Official Logos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Code2 className="size-4.5 text-primary" />
                  <h4 className="text-sm font-semibold tracking-wide uppercase text-foreground">
                    Comprehensive Tech Stack
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {/* 1. Next.js 15 */}
                  <div className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-black/60 border border-white/10 p-1.5 shadow-xs">
                      <svg viewBox="0 0 180 180" className="size-6 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="90" cy="90" r="90" fill="black" />
                        <path d="M149.508 157.438L69.1478 54H54V125.979H66.9786V69.3659L139.999 164.845C143.333 162.614 146.509 160.137 149.508 157.438Z" fill="url(#next-g1)" />
                        <rect x="115" y="54" width="12.9786" height="71.9786" fill="url(#next-g2)" />
                        <defs>
                          <linearGradient id="next-g1" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white" />
                            <stop offset="1" stopColor="white" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="next-g2" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white" />
                            <stop offset="1" stopColor="white" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Frontend Framework</div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Next.js 15 (App Router)</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">React Server Components & streaming</p>
                    </div>
                  </div>

                  {/* 2. React 19 & TypeScript */}
                  <div className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#20232a] border border-[#61dafb]/20 p-1.5 shadow-xs">
                      <svg viewBox="-11.5 -10.23174 23 20.46348" className="size-6 shrink-0">
                        <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
                        <g stroke="#61DAFB" strokeWidth="1" fill="none">
                          <ellipse rx="11" ry="4.2" />
                          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
                        </g>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Client Runtime</div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">React 19 & TypeScript</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">Strict type safety & optimistic state</p>
                    </div>
                  </div>

                  {/* 3. Tailwind CSS v4 */}
                  <div className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#0f172a] border border-[#38bdf8]/20 p-1.5 shadow-xs">
                      <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="none">
                        <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.335 6.182 14.974 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.335 13.382 8.974 12 6.001 12z" fill="#38BDF8" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Styling & Design Tokens</div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Tailwind CSS v4</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">Emerald / teal palette & glassmorphism</p>
                    </div>
                  </div>

                  {/* 4. Supabase PostgreSQL */}
                  <div className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#1c1c1c] border border-[#3ecf8e]/20 p-1.5 shadow-xs">
                      <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="none">
                        <path d="M21.362 9.354H12V.3a.3.3 0 0 0-.535-.19L.863 13.918a.3.3 0 0 0 .235.495H10.5v9.054a.3.3 0 0 0 .535.19l10.602-13.808a.3.3 0 0 0-.275-.495z" fill="#3ECF8E" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Database & Security Definer</div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Supabase PostgreSQL</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">Atomic timer RPCs & strict RLS</p>
                    </div>
                  </div>

                  {/* 5. Supabase Realtime */}
                  <div className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#112423] border border-teal-500/30 p-1.5 shadow-xs">
                      <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                        <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
                        <circle cx="12" cy="12" r="2.5" fill="#2DD4BF" />
                        <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
                        <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Multi-Device Sync</div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Supabase Realtime</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">WebSocket subscription & multi-tab bus</p>
                    </div>
                  </div>

                  {/* 6. Web Audio API */}
                  <div className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#271d0e] border border-amber-500/30 p-1.5 shadow-xs">
                      <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 10v4" />
                        <path d="M6 6v12" />
                        <path d="M10 3v18" />
                        <path d="M14 8v8" />
                        <path d="M18 5v14" />
                        <path d="M22 10v4" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Procedural Synthesis</div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Web Audio API</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">Zero-asset Brownian, rain & white noise</p>
                    </div>
                  </div>

                  {/* 7. Spotify iFrame API */}
                  <div className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#0e2114] border border-[#1db954]/30 p-1.5 shadow-xs">
                      <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="#1DB954">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Circadian Music</div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Spotify iFrame API</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">Time-of-day study playlist curation</p>
                    </div>
                  </div>

                  {/* 8. Vercel AI SDK */}
                  <div className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-black border border-white/20 p-1.5 shadow-xs">
                      <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none">
                        <path d="M12 2L24 22H0L12 2Z" fill="#FFFFFF" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Adaptive Intelligence</div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Vercel AI SDK</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">LLM weekly plan generation</p>
                    </div>
                  </div>

                  {/* 9. Recharts & date-fns */}
                  <div className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-md">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#1f192b] border border-purple-500/30 p-1.5 shadow-xs">
                      <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v18h18" />
                        <path d="M18 9l-5 5-4-4-3 3" />
                        <circle cx="18" cy="9" r="1.5" fill="#A78BFA" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Analytics & Heatmaps</div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Recharts & date-fns</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">Session trends & timezone alignment</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: CREATOR & LINKS (ALEXHZIER ASDAIN) */}
          {/* ========================================================================= */}
          {activeSection === "creator" && (
            <div className="animate-in fade-in-50 zoom-in-[0.98] duration-300 space-y-6">
              {/* 3D Interactive Creator Profile Card with Photo */}
              <TiltCard maxTilt={7} className="w-full">
                <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-accent/25 p-6 sm:p-8 shadow-xl">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 -left-20 size-60 rounded-full bg-teal-500/10 blur-3xl"
                  />

                  <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4 sm:gap-5">
                      {/* Photo Avatar with 3D Depth */}
                      <div
                        style={{ transform: "translateZ(30px)" }}
                        className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-2xl bg-[#0d1417] ring-2 ring-primary/60 shadow-[0_10px_25px_rgba(13,122,110,0.4)]"
                      >
                        <Image
                          src="/creator.jpg"
                          alt="Alexhzier Asdain"
                          width={96}
                          height={96}
                          className="size-full object-cover"
                          priority
                        />
                        <span
                          aria-label="Online Status"
                          className="absolute bottom-1.5 right-1.5 size-3.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          <User className="size-3.5" /> Project Creator & Lead Engineer
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                          Alexhzier Asdain
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
                {/* Developer Portfolio */}
                <a
                  href="https://alexhzier-asdain-portfolio.vercel.app/"
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
                      Software engineering portfolio, featured web applications, and live case studies.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 font-mono text-[11px] font-semibold text-primary">
                    <span>Visit Portfolio</span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>

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
                      View open source contributions, repositories, and developer activity.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 font-mono text-[11px] font-semibold text-primary">
                    <span>@Alexhzier</span>
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
