export function buildAppleMusicSearchLink(track = {}, storefront = "kr") {
  const term = [
    track.appleMusicSearchTerm,
    `${track.artist || ""} ${track.title || ""}`
  ].find((value) => String(value || "").trim());

  return `https://music.apple.com/${encodeURIComponent(storefront || "kr")}/search?term=${encodeURIComponent(String(term || "music").trim())}`;
}

export function buildFallbackArtworkUrl(track = {}) {
  const title = String(track.title || "Date Music").trim();
  const artist = String(track.artist || "Apple Music").trim();
  const initials = getInitials(title, artist);
  const safeTitle = escapeXml(truncate(title, 28));
  const safeArtist = escapeXml(truncate(artist, 30));
  const safeInitials = escapeXml(initials);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${safeTitle} album artwork">
      <rect width="600" height="600" rx="44" fill="#F4F4EE"/>
      <circle cx="464" cy="456" r="158" fill="#CCCCC7" opacity="0.38"/>
      <circle cx="126" cy="128" r="74" fill="#CCCCC7" opacity="0.28"/>
      <text x="54" y="286" fill="#CCCCC7" font-family="Arial, Helvetica, sans-serif" font-size="116" font-weight="800" letter-spacing="-8">${safeInitials}</text>
      <text x="56" y="392" fill="#CCCCC7" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" letter-spacing="-1.5">${safeTitle}</text>
      <text x="56" y="442" fill="#CCCCC7" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="600" letter-spacing="-1">${safeArtist}</text>
    </svg>
  `.replace(/\s+/g, " ").trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getInitials(title, artist) {
  const source = title || artist || "DM";
  const compact = source.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const words = compact.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  }

  return compact.slice(0, 2).toUpperCase() || "DM";
}

function truncate(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
