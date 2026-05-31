const KNOWN_TRACKS = [
  {
    keys: [
      "bts yet to come",
      "yet to come bts",
      "bts yet to come the most beautiful moment",
      "yet to come the most beautiful moment bts"
    ],
    storefrontUrls: {
      kr: "https://music.apple.com/kr/album/yet-to-come/1627573936?i=1627575774&uo=4",
      us: "https://music.apple.com/us/song/yet-to-come/1627575774?uo=4"
    },
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/f7/68/9c/f7689ce3-6d41-60cd-62d2-57a91ddf5b9d/196922067341_Cover.jpg/600x600bf-60.jpg"
  }
];

export function resolveKnownAppleMusicTrack(candidate = {}, storefront = "kr") {
  const candidateKeys = buildCandidateKeys(candidate);
  const match = KNOWN_TRACKS.find((track) => {
    return track.keys.some((key) => candidateKeys.includes(normalizeKey(key)));
  });

  if (!match) return null;

  const region = String(storefront || "kr").toLowerCase();

  return {
    url: match.storefrontUrls[region] || match.storefrontUrls.kr || match.storefrontUrls.us,
    artworkUrl: match.artworkUrl
  };
}

function buildCandidateKeys(candidate) {
  return [
    candidate.appleMusicSearchTerm,
    `${candidate.artist || ""} ${candidate.title || ""}`,
    `${candidate.title || ""} ${candidate.artist || ""}`
  ]
    .map(normalizeKey)
    .filter(Boolean);
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
