const resolvedLinkCache = new Map();

export async function resolveAppleMusicTrackUrl(candidate, storefront = "kr") {
  const track = await resolveAppleMusicTrack(candidate, storefront);
  return track.url;
}

export async function resolveAppleMusicTrack(candidate, storefront = "kr") {
  const searchTerm = candidate.appleMusicSearchTerm || `${candidate.title} ${candidate.artist}`;
  const cacheKey = `${storefront}:${searchTerm}`.toLowerCase();

  if (resolvedLinkCache.has(cacheKey)) {
    return resolvedLinkCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    term: searchTerm,
    country: storefront.toUpperCase(),
    media: "music",
    entity: "song",
    limit: "1"
  });

  try {
    const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`iTunes Search API responded with ${response.status}`);
    }

    const data = await response.json();
    const result = data.results?.[0];
    const track = {
      url: result?.trackViewUrl || "",
      artworkUrl: normalizeArtworkUrl(result?.artworkUrl100 || "")
    };
    resolvedLinkCache.set(cacheKey, track);
    return track;
  } catch {
    const emptyTrack = {
      url: "",
      artworkUrl: ""
    };
    resolvedLinkCache.set(cacheKey, emptyTrack);
    return emptyTrack;
  }
}

function normalizeArtworkUrl(url) {
  return String(url || "").replace("100x100bb", "600x600bb");
}
