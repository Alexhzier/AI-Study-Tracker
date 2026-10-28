"use client";

import { ExternalLink, Info, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { parseSpotifyPlaylistId } from "@/lib/focus/timer";
import {
  CURATED_PLAYLISTS,
  buildSpotifyEmbedUrl,
  buildSpotifyExternalUrl,
  type CuratedPlaylist,
} from "@/lib/music/playlists";
import { fieldClass } from "@/lib/ui";

interface SpotifyEmbedProps {
  selectedPlaylistId: string;
  onPlaylistChange: (playlistId: string) => void;
  recommendedCategory: "morning" | "afternoon" | "night";
}

export function SpotifyEmbed({
  selectedPlaylistId,
  onPlaylistChange,
  recommendedCategory,
}: SpotifyEmbedProps) {
  const [customInput, setCustomInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Validate currently active playlist ID
  const activeParsed = parseSpotifyPlaylistId(selectedPlaylistId);
  const validPlaylistId = activeParsed.isValid && activeParsed.playlistId ? activeParsed.playlistId : CURATED_PLAYLISTS[0].spotifyId;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);
    const parsed = parseSpotifyPlaylistId(customInput);
    if (!parsed.isValid || !parsed.playlistId) {
      setInputError("Invalid Spotify playlist URL or 22-character ID.");
      return;
    }
    onPlaylistChange(parsed.playlistId);
    setCustomInput("");
  };

  return (
    <div className="space-y-4">
      {/* Category selection buttons */}
      <div className="grid grid-cols-3 gap-2">
        {CURATED_PLAYLISTS.map((playlist: CuratedPlaylist) => {
          const isSelected = selectedPlaylistId === playlist.spotifyId;
          const isRecommended = recommendedCategory === playlist.category;

          return (
            <button
              key={playlist.id}
              type="button"
              onClick={() => {
                setShowCustomInput(false);
                onPlaylistChange(playlist.spotifyId);
              }}
              className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? "border-emerald-500/80 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/30 shadow-xs"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-2 right-2 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                  <Sparkles className="size-2" aria-hidden="true" />
                  Suggested
                </span>
              )}
              <span className="text-xs font-bold leading-tight mt-0.5">{playlist.title}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 opacity-80 leading-tight">
                {playlist.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Playlist Toggle & Input */}
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
        >
          {showCustomInput ? "Hide custom playlist" : "Use custom playlist URL / ID…"}
        </button>

        <a
          href={buildSpotifyExternalUrl(validPlaylistId)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>Open in Spotify</span>
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>

      {showCustomInput && (
        <form onSubmit={handleCustomSubmit} className="space-y-2 p-3 rounded-xl border border-border/60 bg-card/40 animate-in fade-in">
          <label htmlFor="custom-spotify-input" className="block text-[11px] font-medium text-muted-foreground">
            Paste Spotify Playlist Link or 22-character ID:
          </label>
          <div className="flex gap-2">
            <input
              id="custom-spotify-input"
              type="text"
              placeholder="https://open.spotify.com/playlist/..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className={fieldClass}
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-all"
            >
              Load
            </button>
          </div>
          {inputError && <p className="text-[11px] text-destructive">{inputError}</p>}
        </form>
      )}

      {/* Honest 30-second preview notice */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
        <Info className="size-3.5 shrink-0 text-amber-500 mt-0.5" aria-hidden="true" />
        <span>
          Spotify plays 30-second track previews in web embeds unless you are logged into Spotify in this browser with cookies enabled. To listen to full songs without interruption, click <strong>Open in Spotify</strong>.
        </span>
      </div>

      {/* Spotify Official Iframe Embed */}
      <div className="rounded-xl overflow-hidden border border-border/70 shadow-lg bg-card/60">
        <iframe
          src={buildSpotifyEmbedUrl(validPlaylistId)}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Focus Playlist"
          className="w-full border-0 block"
        />
      </div>
    </div>
  );
}
