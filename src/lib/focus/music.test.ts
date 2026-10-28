import assert from "node:assert/strict";
import test from "node:test";
import { parseSpotifyPlaylistId } from "./timer.ts";
import {
  CURATED_PLAYLISTS,
  buildSpotifyEmbedUrl,
  buildSpotifyExternalUrl,
  getRecommendedPlaylist,
} from "../music/playlists.ts";
import { AMBIENT_SOUNDS } from "../music/tracks.ts";

test("CURATED_PLAYLISTS: all IDs are strictly valid 22-character Spotify IDs", () => {
  assert.equal(CURATED_PLAYLISTS.length >= 3, true);

  for (const playlist of CURATED_PLAYLISTS) {
    const parsed = parseSpotifyPlaylistId(playlist.spotifyId);
    assert.equal(
      parsed.isValid,
      true,
      `Playlist ${playlist.title} (${playlist.spotifyId}) must be valid`,
    );
    assert.equal(playlist.spotifyId.length, 22);
    assert.equal(playlist.verified, true);
  }
});

test("getRecommendedPlaylist: returns appropriate playlist by local hour", () => {
  const morningPlaylist = getRecommendedPlaylist(8);
  assert.equal(morningPlaylist.category, "morning");

  const afternoonPlaylist = getRecommendedPlaylist(14);
  assert.equal(afternoonPlaylist.category, "afternoon");

  const nightPlaylist = getRecommendedPlaylist(22);
  assert.equal(nightPlaylist.category, "night");

  const earlyMorningPlaylist = getRecommendedPlaylist(2);
  assert.equal(earlyMorningPlaylist.category, "night");
});

test("buildSpotifyEmbedUrl: generates secure embed URLs with generator and dark theme params", () => {
  const id = "37i9dQZF1DX4sWSpwq3LiO";
  const embedUrl = buildSpotifyEmbedUrl(id);
  assert.equal(
    embedUrl,
    "https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0",
  );

  const fullUrl = `https://open.spotify.com/playlist/${id}`;
  assert.equal(
    buildSpotifyEmbedUrl(fullUrl),
    "https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0",
  );
});

test("buildSpotifyExternalUrl: generates direct web app links", () => {
  const id = "37i9dQZF1DX4sWSpwq3LiO";
  assert.equal(
    buildSpotifyExternalUrl(id),
    "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
  );
});

test("AMBIENT_SOUNDS: all procedural sounds are configured", () => {
  assert.equal(AMBIENT_SOUNDS.length, 3);
  const soundIds = AMBIENT_SOUNDS.map((s) => s.id);
  assert.deepEqual(soundIds, ["brown_noise", "rain", "white_noise"]);
});
