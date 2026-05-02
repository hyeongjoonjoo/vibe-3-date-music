import { getSeedRecommendationsData } from "./localDataRegistry.js";

export function createMockMusicService() {
  return {
    mode: "demo",
    isReady() {
      return true;
    },
    async initialize() {
      return {
        mode: "demo",
        ready: true,
        reason: "Using local seed recommendations."
      };
    },
    async searchTracks(searchTerms = [], options = {}) {
      return searchMockTracks(searchTerms, options);
    },
    buildTrackLink(track) {
      return buildMockTrackLink(track);
    }
  };
}

export async function searchMockTracks(searchTerms = [], options = {}) {
  const fallbackCandidates =
    options.fallbackCandidates ||
    getSeedRecommendationsData().songs ||
    [];
  const normalizedTerms = searchTerms.map(normalizeSearchValue).filter(Boolean);

  const shouldFilter = !options.includeAllFallback;
  const tracks = fallbackCandidates
    .filter((candidate) => {
      if (!shouldFilter) return true;
      if (normalizedTerms.length === 0) return true;

      const haystack = normalizeSearchValue([
        candidate.title,
        candidate.artist,
        candidate.appleMusicSearchTerm,
        candidate.lyricHint,
        candidate.notes,
        ...(candidate.eventTags || []),
        ...(candidate.dateTags || []),
        ...(candidate.moodTags || [])
      ].join(" "));

      return normalizedTerms.some((term) => haystack.includes(term));
    })
    .map(normalizeMockTrack);

  return {
    mode: "demo",
    source: "local",
    tracks,
    warnings: []
  };
}

export function normalizeMockTrack(candidate) {
  return {
    id: candidate.id,
    title: candidate.title,
    artist: candidate.artist,
    albumName: "",
    artworkUrl: "",
    previewUrl: "",
    appleMusicUrl: "",
    appleMusicSearchTerm: candidate.appleMusicSearchTerm,
    source: "mock",
    raw: candidate
  };
}

export function buildMockTrackLink(track) {
  const term = track.appleMusicSearchTerm || `${track.title || ""} ${track.artist || ""}`;
  return `https://music.apple.com/kr/search?term=${encodeURIComponent(term.trim())}`;
}

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}
