"use client";

import { CloudRain, Pause, Play, Volume2, VolumeX, Waves, Wind } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AMBIENT_SOUNDS, type AmbientSoundType } from "@/lib/music/tracks";

interface BuiltInPlayerProps {
  currentSound: AmbientSoundType;
  onSoundChange: (sound: AmbientSoundType) => void;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  volume: number; // 0..100
  onVolumeChange: (volume: number) => void;
}

export function BuiltInPlayer({
  currentSound,
  onSoundChange,
  isPlaying,
  onPlayStateChange,
  volume,
  onVolumeChange,
}: BuiltInPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const lfoNodeRef = useRef<OscillatorNode | null>(null);

  // Stop active synthesis nodes
  const stopSynthesis = useCallback(() => {
    try {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (lfoNodeRef.current) {
        lfoNodeRef.current.stop();
        lfoNodeRef.current.disconnect();
        lfoNodeRef.current = null;
      }
      if (filterNodeRef.current) {
        filterNodeRef.current.disconnect();
        filterNodeRef.current = null;
      }
    } catch {
      // Ignore disconnect errors on stopped nodes
    }
  }, []);

  // Generate buffer and start synthesizer for current sound
  const startSynthesis = useCallback(
    async (sound: AmbientSoundType) => {
      stopSynthesis();

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch {
          // Awaiting user gesture
          return;
        }
      }

      // Master gain
      if (!gainNodeRef.current) {
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gainNodeRef.current = gain;
      }

      const effectiveVolume = isMuted ? 0 : (volume / 100) * 0.45;
      gainNodeRef.current.gain.setValueAtTime(effectiveVolume, ctx.currentTime);

      const sampleRate = ctx.sampleRate;
      const bufferDuration = 5.0; // 5-second seamless loop
      const frameCount = sampleRate * bufferDuration;
      const buffer = ctx.createBuffer(2, frameCount, sampleRate);

      if (sound === "white_noise") {
        // Broad-spectrum uniform noise
        for (let ch = 0; ch < 2; ch++) {
          const data = buffer.getChannelData(ch);
          for (let i = 0; i < frameCount; i++) {
            data[i] = Math.random() * 2 - 1;
          }
        }

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(3200, ctx.currentTime);
        filterNodeRef.current = filter;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(filter);
        filter.connect(gainNodeRef.current);
        source.start();
        sourceNodeRef.current = source;
      } else if (sound === "brown_noise") {
        // Integrated Brownian / Red noise with warm bass rumble
        for (let ch = 0; ch < 2; ch++) {
          const data = buffer.getChannelData(ch);
          let lastOut = 0.0;
          for (let i = 0; i < frameCount; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + 0.025 * white) / 1.025;
            data[i] = lastOut * 3.8;
          }
        }

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(550, ctx.currentTime);
        filterNodeRef.current = filter;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(filter);
        filter.connect(gainNodeRef.current);
        source.start();
        sourceNodeRef.current = source;
      } else if (sound === "rain") {
        // Pink noise base with modulated bandpass filter simulating raindrops
        for (let ch = 0; ch < 2; ch++) {
          const data = buffer.getChannelData(ch);
          let b0 = 0,
            b1 = 0,
            b2 = 0,
            b3 = 0,
            b4 = 0,
            b5 = 0,
            b6 = 0;
          for (let i = 0; i < frameCount; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.969 * b2 + white * 0.153852;
            b3 = 0.8665 * b3 + white * 0.3104856;
            b4 = 0.55 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.016898;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
            b6 = white * 0.115926;
          }
        }

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(950, ctx.currentTime);
        filter.Q.setValueAtTime(0.85, ctx.currentTime);
        filterNodeRef.current = filter;

        // Subtle LFO modulation for rain surge effect
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(0.3, ctx.currentTime); // 0.3 Hz surge
        lfoGain.gain.setValueAtTime(250, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        lfoNodeRef.current = lfo;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(filter);
        filter.connect(gainNodeRef.current);
        source.start();
        sourceNodeRef.current = source;
      }
    },
    [volume, isMuted, stopSynthesis],
  );

  // Sync volume changes to active gain node smoothly
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const effective = isMuted ? 0 : (volume / 100) * 0.45;
      gainNodeRef.current.gain.linearRampToValueAtTime(
        effective,
        audioCtxRef.current.currentTime + 0.05,
      );
    }
  }, [volume, isMuted]);

  // Handle play/pause state and sound track switches
  useEffect(() => {
    if (isPlaying) {
      startSynthesis(currentSound);
    } else {
      stopSynthesis();
    }

    return () => {
      stopSynthesis();
    };
  }, [isPlaying, currentSound, startSynthesis, stopSynthesis]);

  // Teardown audio context when unmounting
  useEffect(() => {
    return () => {
      stopSynthesis();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopSynthesis]);

  const togglePlay = () => {
    onPlayStateChange(!isPlaying);
  };

  const getSoundIcon = (id: AmbientSoundType) => {
    switch (id) {
      case "brown_noise":
        return <Wind className="size-4 shrink-0 text-amber-400" aria-hidden="true" />;
      case "rain":
        return <CloudRain className="size-4 shrink-0 text-sky-400" aria-hidden="true" />;
      case "white_noise":
        return <Waves className="size-4 shrink-0 text-teal-400" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Sound selector buttons */}
      <div className="grid grid-cols-3 gap-2">
        {AMBIENT_SOUNDS.map((sound) => {
          const isSelected = currentSound === sound.id;
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => {
                onSoundChange(sound.id);
                if (!isPlaying) onPlayStateChange(true);
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? "border-emerald-500/80 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/30 shadow-xs"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <div className="mb-1.5">{getSoundIcon(sound.id)}</div>
              <span className="text-xs font-bold leading-tight">{sound.name}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 opacity-80 leading-tight">
                {sound.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Playback Controls & Volume Slider */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
            aria-label={isPlaying ? "Pause ambient sound" : "Play ambient sound"}
          >
            {isPlaying ? (
              <>
                <Pause className="size-3.5" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" aria-hidden="true" />
                <span>Play Sound</span>
              </>
            )}
          </button>

          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            {isPlaying ? "Procedural Web Audio active" : "Offline soundscapes"}
          </span>
        </div>

        {/* Master Volume Controls */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="size-4 text-destructive" aria-hidden="true" />
            ) : (
              <Volume2 className="size-4" aria-hidden="true" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              if (isMuted) setIsMuted(false);
              onVolumeChange(Number(e.target.value));
            }}
            className="w-24 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
            aria-label="Built-in ambient sound volume"
          />
          <span className="text-[11px] font-mono tabular-nums text-muted-foreground w-7 text-right">
            {isMuted ? "0%" : `${volume}%`}
          </span>
        </div>
      </div>
    </div>
  );
}
