export type AmbientSoundType = "brown_noise" | "rain" | "white_noise";

export interface AmbientSound {
  id: AmbientSoundType;
  name: string;
  subtitle: string;
  description: string;
  type: "procedural";
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: "brown_noise",
    name: "Brown Noise",
    subtitle: "Deep & Warm Rumble",
    description: "Low-frequency heavy acoustic masking ideal for deep concentration and ADHD focus.",
    type: "procedural",
  },
  {
    id: "rain",
    name: "Soft Rain",
    subtitle: "Gentle Precipitation",
    description: "Rhythmically modulated rainfall synthesized in real time via the Web Audio API.",
    type: "procedural",
  },
  {
    id: "white_noise",
    name: "White Noise",
    subtitle: "Full-Spectrum Mask",
    description: "Consistent broadband frequencies that mask background conversations and noise.",
    type: "procedural",
  },
];

export interface CustomAudioTrack {
  id: string;
  title: string;
  artist: string;
  src: string; // e.g., "/audio/track.mp3"
  license: string;
}

/**
 * Optional user-supplied custom audio tracks placed in public/audio/
 */
export const CUSTOM_AUDIO_TRACKS: CustomAudioTrack[] = [];
