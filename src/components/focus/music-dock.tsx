"use client";

import { ChevronDown, ChevronUp, Headphones, Music, VolumeX } from "lucide-react";
import React, { useEffect, useState } from "react";
import { BuiltInPlayer } from "@/components/focus/built-in-player";
import { SpotifyEmbed } from "@/components/focus/spotify-embed";
import { getTimeOfDayCategory } from "@/lib/focus/timer";
import { CURATED_PLAYLISTS, getRecommendedPlaylist } from "@/lib/music/playlists";
import type { AmbientSoundType } from "@/lib/music/tracks";

export type AudioSource = "ambient" | "spotify" | "off";

interface MusicDockProps {
  userId: string;
}

export function MusicDock({ userId }: MusicDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSource>("ambient");
  const [currentSound, setCurrentSound] = useState<AmbientSoundType>("brown_noise");
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [ambientVolume, setAmbientVolume] = useState(65);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(CURATED_PLAYLISTS[0].spotifyId);
  const [recommendedCategory, setRecommendedCategory] = useState<"morning" | "afternoon" | "night">("morning");

  // Load client circadian recommendation and saved preferences after hydration
  useEffect(() => {
    try {
      const h = new Date().getHours();
      const rec = getTimeOfDayCategory(h);
      setRecommendedCategory(rec);

      const defaultPlaylist = getRecommendedPlaylist(h);
      setSelectedPlaylistId(defaultPlaylist.spotifyId);

      const stored = localStorage.getItem(`study-tracker:music-prefs:v1:${userId}`);
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.audioSource) setAudioSource(prefs.audioSource);
        if (prefs.currentSound) setCurrentSound(prefs.currentSound);
        if (Number.isFinite(prefs.ambientVolume)) setAmbientVolume(prefs.ambientVolume);
        if (prefs.selectedPlaylistId) setSelectedPlaylistId(prefs.selectedPlaylistId);
        if (typeof prefs.isExpanded === "boolean") setIsExpanded(prefs.isExpanded);
      }
    } catch {
      // LocalStorage unavailable
    }
  }, [userId]);

  // Persist preferences
  const saveMusicPrefs = (updates: Partial<{
    audioSource: AudioSource;
    currentSound: AmbientSoundType;
    ambientVolume: number;
    selectedPlaylistId: string;
    isExpanded: boolean;
  }>) => {
    try {
      const payload = {
        audioSource: updates.audioSource ?? audioSource,
        currentSound: updates.currentSound ?? currentSound,
        ambientVolume: updates.ambientVolume ?? ambientVolume,
        selectedPlaylistId: updates.selectedPlaylistId ?? selectedPlaylistId,
        isExpanded: updates.isExpanded ?? isExpanded,
      };
      localStorage.setItem(`study-tracker:music-prefs:v1:${userId}`, JSON.stringify(payload));
    } catch {
      // Ignore write errors
    }
  };

  const handleSourceChange = (newSource: AudioSource) => {
    setAudioSource(newSource);
    if (newSource !== "ambient") {
      setIsAmbientPlaying(false);
    }
    saveMusicPrefs({ audioSource: newSource });
  };

  return (
    <div
      role="region"
      aria-label="Focus Audio & Music Dock"
      className="w-full max-w-xl mx-auto rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-xl transition-all overflow-hidden"
    >
      {/* Dock Bar / Collapsible Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
            {audioSource === "spotify" ? (
              <Music className="size-4" aria-hidden="true" />
            ) : audioSource === "ambient" ? (
              <Headphones className="size-4" aria-hidden="true" />
            ) : (
              <VolumeX className="size-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Study Soundscapes</span>
              {audioSource === "ambient" && isAmbientPlaying && (
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {audioSource === "off"
                ? "Audio muted"
                : audioSource === "spotify"
                ? "Spotify Focus Stream"
                : isAmbientPlaying
                ? "Playing ambient sound"
                : "Ambient soundscape ready"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick source toggle tabs in the header */}
          <div className="flex rounded-lg border border-border/60 bg-muted/40 p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => {
                handleSourceChange("ambient");
                setIsExpanded(true);
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                audioSource === "ambient"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ambient
            </button>
            <button
              type="button"
              onClick={() => {
                handleSourceChange("spotify");
                setIsExpanded(true);
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                audioSource === "spotify"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Spotify
            </button>
            <button
              type="button"
              onClick={() => {
                handleSourceChange("off");
              }}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                audioSource === "off"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Silence audio"
            >
              Off
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !isExpanded;
              setIsExpanded(next);
              saveMusicPrefs({ isExpanded: next });
            }}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors cursor-pointer"
            aria-label={isExpanded ? "Collapse music dock" : "Expand music dock"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" aria-hidden="true" />
            ) : (
              <ChevronUp className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Dock Body */}
      {isExpanded && audioSource !== "off" && (
        <div className="p-4 bg-card/40 animate-in fade-in slide-in-from-top-2 duration-200">
          {audioSource === "ambient" && (
            <BuiltInPlayer
              currentSound={currentSound}
              onSoundChange={(sound) => {
                setCurrentSound(sound);
                saveMusicPrefs({ currentSound: sound });
              }}
              isPlaying={isAmbientPlaying}
              onPlayStateChange={setIsAmbientPlaying}
              volume={ambientVolume}
              onVolumeChange={(vol) => {
                setAmbientVolume(vol);
                saveMusicPrefs({ ambientVolume: vol });
              }}
            />
          )}

          {audioSource === "spotify" && (
            <SpotifyEmbed
              selectedPlaylistId={selectedPlaylistId}
              onPlaylistChange={(pid) => {
                setSelectedPlaylistId(pid);
                saveMusicPrefs({ selectedPlaylistId: pid });
              }}
              recommendedCategory={recommendedCategory}
            />
          )}
        </div>
      )}
    </div>
  );
}
