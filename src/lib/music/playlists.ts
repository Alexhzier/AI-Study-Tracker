import { getTimeOfDayCategory, parseSpotifyPlaylistId } from "../focus/timer.ts";

export type PlaylistCategory = "morning" | "afternoon" | "night";

export interface CuratedPlaylist {
  id: string;
  category: PlaylistCategory;
  title: string;
  subtitle: string;
  description: string;
  spotifyId: string;
  verified: boolean;
}

export const CURATED_PLAYLISTS: CuratedPlaylist[] = [
  {
    id: "morning-chill",
    category: "morning",
    title: "Morning Chill",
    subtitle: "Peaceful Piano & Gentle Awakening",
    description: "Soothing acoustic and minimal piano melodies to ease into focused study.",
    spotifyId: "37i9dQZF1DX4sWSpwq3LiO", // Spotify: Peaceful Piano
    verified: true,
  },
  {
    id: "afternoon-flow",
    category: "afternoon",
    title: "Afternoon Flow",
    subtitle: "Steady Rhythms & Chillhop",
    description: "Instrumental hip-hop and downtempo grooves to sustain momentum.",
    spotifyId: "37i9dQZF1DXdLEN7aqioXM", // Spotify: Focus Flow
    verified: true,
  },
  {
    id: "night-lofi",
    category: "night",
    title: "Night Lo-Fi",
    subtitle: "Cozy Ambient & Deep Focus",
    description: "Warm tape-saturated beats and quiet ambient textures for evening study.",
    spotifyId: "37i9dQZF1DX9uKNf5jGX6m", // Spotify: Lofi Sleep & Ambient
    verified: true,
  },
];

/**
 * Returns the recommended playlist based on local client hour (0..23).
 * Falls back to current client time if hour is not provided.
 */
export function getRecommendedPlaylist(hour?: number): CuratedPlaylist {
  const h = hour !== undefined ? hour : new Date().getHours();
  const category = getTimeOfDayCategory(h);
  return (
    CURATED_PLAYLISTS.find((p) => p.category === category) ??
    CURATED_PLAYLISTS[0]
  );
}

/**
 * Generates the official Spotify iframe embed source URL.
 */
export function buildSpotifyEmbedUrl(playlistId: string): string {
  const parsed = parseSpotifyPlaylistId(playlistId);
  const validId = parsed.isValid && parsed.playlistId ? parsed.playlistId : playlistId;
  return `https://open.spotify.com/embed/playlist/${encodeURIComponent(validId)}?utm_source=generator&theme=0`;
}

/**
 * Generates the direct external web link to open the playlist in the Spotify app or web player.
 */
export function buildSpotifyExternalUrl(playlistId: string): string {
  const parsed = parseSpotifyPlaylistId(playlistId);
  const validId = parsed.isValid && parsed.playlistId ? parsed.playlistId : playlistId;
  return `https://open.spotify.com/playlist/${encodeURIComponent(validId)}`;
}
