const resolvedLinkCache = new Map();

export async function resolveAppleMusicTrackUrl(candidate, storefront = "kr") {
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
    const url = data.results?.[0]?.trackViewUrl || "";
    resolvedLinkCache.set(cacheKey, url);
    return url;
  } catch {
    resolvedLinkCache.set(cacheKey, "");
    return "";
  }
}
