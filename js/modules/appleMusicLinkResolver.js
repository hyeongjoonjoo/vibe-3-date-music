import { buildAppleMusicSearchLink, buildFallbackArtworkUrl } from "./appleMusicFallbacks.js";

const resolvedLinkCache = new Map();
const SEARCH_LIMIT = 10;
const MIN_USABLE_SCORE = 65;
const REQUEST_TIMEOUT_MS = 3500;
const JSONP_TIMEOUT_MS = 2200;
let itunesLookupUnavailable = false;

export async function resolveAppleMusicTrackUrl(candidate, storefront = "kr") {
  const track = await resolveAppleMusicTrack(candidate, storefront);
  return track.url;
}

export async function resolveAppleMusicTrack(candidate, storefront = "kr") {
  const searchTerms = buildSearchTerms(candidate);
  const storefronts = buildStorefrontFallbacks(storefront);
  const cacheKey = `${storefronts.join(",")}:${searchTerms.join("|")}`.toLowerCase();

  if (resolvedLinkCache.has(cacheKey)) {
    return resolvedLinkCache.get(cacheKey);
  }

  let bestMatch = null;

  for (const country of storefronts) {
    for (const term of searchTerms) {
      const results = await searchITunes(term, country);
      const scored = results
        .map((result) => ({
          result,
          country,
          term,
          score: scoreResult(result, candidate, term, country, storefront)
        }))
        .sort((a, b) => b.score - a.score);

      const top = scored[0];
      if (!top) continue;

      if (!bestMatch || top.score > bestMatch.score) {
        bestMatch = top;
      }

      if (top.score >= 190 && top.result.artworkUrl100) {
        break;
      }
    }
  }

  const track = bestMatch && bestMatch.score >= MIN_USABLE_SCORE
    ? withFallbackFields(normalizeTrack(bestMatch.result), candidate, storefront)
    : buildFallbackTrack(candidate, storefront);

  resolvedLinkCache.set(cacheKey, track);
  return track;
}

async function searchITunes(term, country) {
  if (itunesLookupUnavailable) {
    return [];
  }

  const params = new URLSearchParams({
    term,
    country: country.toUpperCase(),
    media: "music",
    entity: "song",
    limit: String(SEARCH_LIMIT)
  });

  try {
    const response = await fetchWithTimeout(`https://itunes.apple.com/search?${params.toString()}`);
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        itunesLookupUnavailable = true;
      }
      return [];
    }

    const data = await response.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return searchITunesJsonp(params);
  }
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function searchITunesJsonp(params) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    const callbackName = `__dateMusicItunes${Date.now()}${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      itunesLookupUnavailable = true;
      resolve([]);
    }, JSONP_TIMEOUT_MS);

    window[callbackName] = (data) => {
      window.clearTimeout(timeout);
      cleanup();
      resolve(Array.isArray(data?.results) ? data.results : []);
    };

    script.onerror = () => {
      window.clearTimeout(timeout);
      cleanup();
      itunesLookupUnavailable = true;
      resolve([]);
    };

    const jsonpParams = new URLSearchParams(params);
    jsonpParams.set("callback", callbackName);
    script.src = `https://itunes.apple.com/search?${jsonpParams.toString()}`;
    document.head.append(script);
  });
}

function buildFallbackTrack(candidate, storefront) {
  return {
    url: buildAppleMusicSearchLink(candidate, storefront),
    artworkUrl: buildFallbackArtworkUrl(candidate)
  };
}

function withFallbackFields(track, candidate, storefront) {
  return {
    ...track,
    url: track.url || buildAppleMusicSearchLink(candidate, storefront),
    artworkUrl: track.artworkUrl || buildFallbackArtworkUrl(candidate)
  };
}

function normalizeTrack(result) {
  return {
    url: result?.trackViewUrl || "",
    artworkUrl: normalizeArtworkUrl(result?.artworkUrl100 || "")
  };
}

function buildSearchTerms(candidate = {}) {
  const rawTerms = [
    ...(candidate.appleMusicSearchTerms || []),
    candidate.appleMusicSearchTerm,
    `${candidate.artist || ""} ${candidate.title || ""}`,
    `${candidate.title || ""} ${candidate.artist || ""}`,
    stripParenthetical(`${candidate.artist || ""} ${candidate.title || ""}`),
    stripParenthetical(`${candidate.title || ""} ${candidate.artist || ""}`)
  ];

  return uniqueStrings(rawTerms)
    .map((term) => String(term || "").replace(/\s+/g, " ").trim())
    .filter((term) => term.length > 1)
    .slice(0, 6);
}

function buildStorefrontFallbacks(storefront = "kr") {
  return uniqueStrings([
    storefront,
    "kr",
    "us",
    "jp"
  ]).map((country) => String(country || "kr").toLowerCase());
}

function scoreResult(result, candidate, term, country, requestedStorefront) {
  const expectedTitle = normalizeForMatch(candidate.title);
  const expectedArtist = normalizeForMatch(candidate.artist);
  const resultTitle = normalizeForMatch(result.trackName);
  const resultArtist = normalizeForMatch(result.artistName);
  const resultCollection = normalizeForMatch(result.collectionName);
  const searchTerm = normalizeForMatch(term);

  let score = 0;

  score += scoreTextMatch(expectedTitle, resultTitle, 95, 58);
  score += scoreTextMatch(expectedArtist, resultArtist, 76, 42);

  if (expectedTitle && resultCollection.includes(expectedTitle)) score += 12;
  if (expectedArtist && resultCollection.includes(expectedArtist)) score += 8;
  if (searchTerm.includes(expectedTitle) && searchTerm.includes(expectedArtist)) score += 10;
  if (result.artworkUrl100) score += 28;
  if (result.trackViewUrl) score += 12;
  if (String(country).toLowerCase() === String(requestedStorefront || "").toLowerCase()) score += 4;
  if (result.wrapperType === "track" && result.kind === "song") score += 8;

  const penaltyText = `${resultTitle} ${resultArtist} ${resultCollection}`;
  if (/(karaoke|tribute|originally performed|cover version|instrumental version)/.test(penaltyText)) {
    score -= 80;
  }

  return score;
}

function scoreTextMatch(expected, actual, exactScore, partialScore) {
  if (!expected || !actual) return 0;
  if (expected === actual) return exactScore;
  if (actual.includes(expected) || expected.includes(actual)) return partialScore;

  const overlap = tokenOverlap(expected, actual);
  if (overlap >= 0.8) return Math.round(partialScore * 0.85);
  if (overlap >= 0.55) return Math.round(partialScore * 0.55);
  if (overlap >= 0.34) return Math.round(partialScore * 0.32);
  return 0;
}

function tokenOverlap(first, second) {
  const firstTokens = new Set(first.split(" ").filter((token) => token.length > 1));
  const secondTokens = new Set(second.split(" ").filter((token) => token.length > 1));
  if (firstTokens.size === 0 || secondTokens.size === 0) return 0;

  let matches = 0;
  firstTokens.forEach((token) => {
    if (secondTokens.has(token)) matches += 1;
  });

  return matches / Math.max(firstTokens.size, secondTokens.size);
}

function normalizeArtworkUrl(url) {
  return String(url || "").replace("100x100bb", "600x600bb");
}

function stripParenthetical(value) {
  return String(value || "").replace(/\([^)]*\)|\[[^\]]*\]/g, " ");
}

function normalizeForMatch(value) {
  return stripParenthetical(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(feat|ft|featuring)\b.*$/g, "")
    .replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}
