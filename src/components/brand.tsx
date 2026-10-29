"use client";

import * as React from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { AboutDialog } from "@/components/about/about-dialog";

/**
 * Study Tracker official brand mark and title.
 * Clicking the logo opens the "Project AI Study Tracker" About dialog.
 */
export function Brand() {
  const [aboutOpen, setAboutOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAboutOpen(true)}
        aria-label="About Project AI Study Tracker"
        className="group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-200 hover:bg-secondary/60 cursor-pointer active:scale-98"
      >
        {/* Glowing 3D Brand Logo Mark */}
        <span
          aria-hidden
          className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#0d1417] shadow-md ring-1 ring-emerald-500/30 transition-all duration-300 group-hover:scale-105 group-hover:ring-emerald-400/60 group-hover:shadow-[0_0_15px_rgba(45,212,191,0.35)]"
        >
          <Image
            src="/logo-icon.png"
            alt="Study Tracker Logo"
            width={40}
            height={40}
            className="size-full object-contain p-0.5"
            priority
          />
        </span>

        {/* Brand Text & Subtle "About" Pill */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-lg">
              Study Tracker
            </span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground group-hover:text-primary/90 transition-colors">
            <Sparkles className="size-3 text-primary animate-pulse" />
            <span>About app</span>
          </span>
        </div>
      </button>

      {/* About Project AI Study Tracker Dialog */}
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}
