import { buildSearchTerms, rankRecommendations } from "./recommendationEngine.js";
import { getSeedRecommendationsData } from "./localDataRegistry.js";
import { createAppleMusicService } from "./appleMusicService.js";
import { createMockMusicService } from "./mockMusicService.js";

export function createMusicProvider(config = {}) {
  const requestedMode = config.mode || "demo";
  const appleMusicService = createAppleMusicService(config.appleMusic || {});
  const mockMusicService = createMockMusicService();

  let activeService = requestedMode === "appleMusic" ? appleMusicService : mockMusicService;

  return {
    async initialize() {
      if (requestedMode !== "appleMusic") {
        activeService = mockMusicService;
        return mockMusicService.initialize();
      }

      const status = await appleMusicService.initialize();
      activeService = status.ready ? appleMusicService : mockMusicService;
      return status;
    },

    isReady() {
      return activeService.isReady();
    },

    getMode() {
      return activeService.mode;
    },

    async searchTracksForContext(context, options = {}) {
      const localCandidates = options.candidates || getSeedRecommendationsData().songs || [];
      const rankedFallbackCandidates = rankRecommendations(localCandidates, context);
      const searchTerms = buildSearchTerms(context);

      return activeService.searchTracks(searchTerms, {
        ...options,
        storefront: options.storefront || context.storefront,
        language: options.language || context.locale,
        fallbackCandidates: rankedFallbackCandidates
      });
    },

    buildTrackLink(track) {
      return activeService.buildTrackLink(track);
    }
  };
}
