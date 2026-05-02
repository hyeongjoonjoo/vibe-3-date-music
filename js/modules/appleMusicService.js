import { searchMockTracks, buildMockTrackLink } from "./mockMusicService.js";

const DEFAULT_CONFIG = {
  enabled: false,
  appName: "Date Music Korea",
  appBuild: "0.1.0",
  storefront: "kr",
  language: "ko-KR",
  searchLimit: 5,
  developerToken: "",
  requestUserAuthorization: false
};

const musicKitState = {
  configured: false,
  authorized: false,
  instance: null,
  config: { ...DEFAULT_CONFIG },
  lastError: null
};

export async function initializeMusicKit(config = {}) {
  musicKitState.config = {
    ...DEFAULT_CONFIG,
    ...config
  };
  musicKitState.lastError = null;

  if (!musicKitState.config.enabled) {
    return markUnavailable("Apple Music mode is disabled; demo mode remains active.");
  }

  if (!musicKitState.config.developerToken) {
    // TODO: developer token
    return markUnavailable("Missing Apple Music developer token; falling back to demo mode.");
  }

  if (!getMusicKitGlobal()) {
    // TODO: MusicKit initialization
    return markUnavailable("MusicKit JS is not loaded; falling back to demo mode.");
  }

  try {
    const MusicKit = getMusicKitGlobal();

    MusicKit.configure({
      developerToken: musicKitState.config.developerToken,
      app: {
        name: musicKitState.config.appName,
        build: musicKitState.config.appBuild
      }
    });

    musicKitState.instance = MusicKit.getInstance();
    musicKitState.configured = Boolean(musicKitState.instance);

    if (musicKitState.config.requestUserAuthorization) {
      // TODO: user authorization if needed
      // Required for full playback and personal library operations.
      await musicKitState.instance.authorize();
      musicKitState.authorized = true;
    }

    return {
      mode: "appleMusic",
      ready: isMusicKitReady(),
      authorized: musicKitState.authorized,
      reason: "MusicKit initialized."
    };
  } catch (error) {
    musicKitState.lastError = error;
    return markUnavailable(error.message || "MusicKit initialization failed.");
  }
}

export function isMusicKitReady() {
  return Boolean(
    musicKitState.config.enabled &&
    musicKitState.configured &&
    musicKitState.instance
  );
}

export async function searchAppleMusicTracks(searchTerms = [], options = {}) {
  if (!isMusicKitReady()) {
    return fallbackToMock(searchTerms, options, "MusicKit is not ready.");
  }

  const terms = normalizeSearchTerms(searchTerms);

  if (terms.length === 0) {
    return fallbackToMock(searchTerms, options, "No search terms were provided.");
  }

  const tracks = [];
  const warnings = [];

  for (const term of terms) {
    try {
      const results = await searchCatalogSongs(term, options);
      tracks.push(...results);
    } catch (error) {
      warnings.push(`Apple Music search failed for "${term}": ${error.message}`);
    }
  }

  const uniqueTracks = uniqueBy(tracks, (track) => track.appleMusicId || `${track.title}-${track.artist}`);

  if (uniqueTracks.length === 0) {
    return fallbackToMock(searchTerms, options, "Apple Music returned no usable tracks.");
  }

  return {
    mode: "appleMusic",
    source: "appleMusicCatalog",
    tracks: uniqueTracks,
    warnings
  };
}

export function buildAppleMusicLink(track) {
  if (track?.appleMusicUrl) {
    return track.appleMusicUrl;
  }

  if (track?.attributes?.url) {
    return track.attributes.url;
  }

  if (track?.url) {
    return track.url;
  }

  return buildMockTrackLink(track || {});
}

export function createAppleMusicService(config = {}) {
  return {
    mode: "appleMusic",
    initialize() {
      return initializeMusicKit(config);
    },
    isReady() {
      return isMusicKitReady();
    },
    searchTracks(searchTerms, options) {
      return searchAppleMusicTracks(searchTerms, options);
    },
    buildTrackLink(track) {
      return buildAppleMusicLink(track);
    },
    getStatus() {
      return {
        mode: isMusicKitReady() ? "appleMusic" : "demo",
        ready: isMusicKitReady(),
        authorized: musicKitState.authorized,
        lastError: musicKitState.lastError
      };
    }
  };
}

async function searchCatalogSongs(term, options = {}) {
  const storefront = options.storefront || musicKitState.config.storefront;
  const language = options.language || musicKitState.config.language;
  const limit = options.limit || musicKitState.config.searchLimit;
  const endpoint = buildCatalogSearchEndpoint({ storefront, term, language, limit });

  if (musicKitState.instance?.api?.music) {
    const response = await musicKitState.instance.api.music(endpoint);
    return normalizeAppleMusicSongResults(response);
  }

  const response = await fetch(`https://api.music.apple.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${musicKitState.config.developerToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Apple Music API responded with ${response.status}.`);
  }

  const data = await response.json();
  return normalizeAppleMusicSongResults(data);
}

function buildCatalogSearchEndpoint({ storefront, term, language, limit }) {
  const params = new URLSearchParams({
    term,
    types: "songs",
    limit: String(limit)
  });

  if (language) {
    params.set("l", language);
  }

  return `/v1/catalog/${encodeURIComponent(storefront)}/search?${params.toString()}`;
}

function normalizeAppleMusicSongResults(response) {
  const songs =
    response?.results?.songs?.data ||
    response?.data?.results?.songs?.data ||
    [];

  return songs.map(normalizeAppleMusicTrack);
}

function normalizeAppleMusicTrack(song) {
  const attributes = song.attributes || {};
  const artworkUrl = attributes.artwork?.url
    ? attributes.artwork.url.replace("{w}", "600").replace("{h}", "600")
    : "";

  return {
    id: song.id,
    appleMusicId: song.id,
    title: attributes.name || "",
    artist: attributes.artistName || "",
    albumName: attributes.albumName || "",
    artworkUrl,
    previewUrl: attributes.previews?.[0]?.url || "",
    appleMusicUrl: attributes.url || "",
    source: "appleMusic",
    raw: song
  };
}

async function fallbackToMock(searchTerms, options, reason) {
  const mockResult = await searchMockTracks(searchTerms, {
    ...options,
    includeAllFallback: true
  });

  return {
    ...mockResult,
    warnings: [reason, ...(mockResult.warnings || [])]
  };
}

function markUnavailable(reason) {
  musicKitState.configured = false;
  musicKitState.authorized = false;
  musicKitState.instance = null;

  return {
    mode: "demo",
    ready: false,
    authorized: false,
    reason
  };
}

function getMusicKitGlobal() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.MusicKit || null;
}

function normalizeSearchTerms(searchTerms) {
  return uniqueBy(
    searchTerms
      .map((term) => String(term || "").trim())
      .filter((term) => term.length > 1),
    (term) => term.toLowerCase()
  ).slice(0, 6);
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(item);
  }

  return result;
}
