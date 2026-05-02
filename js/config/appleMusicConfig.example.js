export const APPLE_MUSIC_CONFIG = {
  enabled: false,
  appName: "Date Music Korea",
  appBuild: "0.1.0",
  storefront: "kr",
  language: "ko-KR",
  searchLimit: 5,

  // TODO: developer token
  // Generate this outside the browser using your Apple Music private key.
  // Do not commit real tokens to source control.
  developerToken: "",

  // TODO: MusicKit initialization
  // In the final HTML shell, load MusicKit JS before calling initializeMusicKit:
  // <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>

  // TODO: user authorization if needed
  // Catalog search can work with a developer token, but full playback and
  // personal library access require MusicKit authorization.
  requestUserAuthorization: false
};
