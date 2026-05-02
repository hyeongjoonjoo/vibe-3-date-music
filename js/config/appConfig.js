import { APPLE_MUSIC_CONFIG } from "./appleMusicConfig.example.js";

export const APP_CONFIG = {
  defaultDate: null,
  maxRecommendations: 1,
  musicProviderMode: APPLE_MUSIC_CONFIG.enabled ? "appleMusic" : "demo",
  appleMusic: APPLE_MUSIC_CONFIG
};
