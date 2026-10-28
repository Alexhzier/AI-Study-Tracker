"use client";

import Link from "next/link";
import { ArrowLeft, Maximize2, Minimize2, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Subject } from "@/lib/types";

interface FocusHeaderProps {
  subject?: Subject;
  objective?: string | null;
  onEditObjective?: () => void;
}

export function FocusHeader({ subject, objective, onEditObjective }: FocusHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  useEffect(() => {
    setCanFullscreen(typeof document !== "undefined" && Boolean(document.fullscreenEnabled));

    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!canFullscreen) return;
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request declined:", e);
    }
  };

  return (
    <header className="flex w-full items-center justify-between px-4 py-3.5 sm:px-8 border-b border-border/40 bg-background/60 backdrop-blur-md">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:scale-95"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </div>

      {/* Subject & Objective Centerpiece */}
      <div className="flex items-center gap-2 max-w-[50%] sm:max-w-md truncate">
        {subject && (
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-xs">
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: subject.color ?? "#10b981" }}
              aria-hidden="true"
            />
            <span className="truncate">{subject.name}</span>
          </div>
        )}

        {objective && (
          <button
            type="button"
            onClick={onEditObjective}
            className="hidden md:flex items-center gap-1.5 truncate rounded-full border border-border/40 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
            title="Click to edit objective"
          >
            <Target className="size-3 text-emerald-500 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[200px]">{objective}</span>
          </button>
        )}
      </div>

      {/* Right controls: Fullscreen */}
      <div className="flex items-center gap-2">
        {canFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="size-4" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
