import { APP_CONFIG } from "./config/appConfig.js";
import { EVENTS_KO } from "./data/events-ko.js";
import { SEED_RECOMMENDATIONS } from "./data/seed-recommendations.js";
import { configureLocalData } from "./modules/localDataRegistry.js";
import { getEventContextFromDate } from "./modules/dateContext.js";
import { buildSearchTerms, rankRecommendations } from "./modules/recommendationEngine.js";
import { createMusicProvider } from "./modules/musicProvider.js";
import { createUIRenderer } from "./modules/uiRenderer.js";
import { parseSelectedDate, toISODate } from "./modules/dateUtils.js";
import { resolveAppleMusicTrack } from "./modules/appleMusicLinkResolver.js";

configureLocalData({
  events: EVENTS_KO,
  recommendations: SEED_RECOMMENDATIONS
});

const ui = createUIRenderer(document);
const musicProvider = createMusicProvider({
  mode: APP_CONFIG.musicProviderMode,
  appleMusic: APP_CONFIG.appleMusic
});

const state = {
  events: EVENTS_KO.events,
  context: null,
  recommendations: [],
  providerMode: "demo",
  maxRecommendations: APP_CONFIG.maxRecommendations,
  appleMusicSearchUrl: "https://music.apple.com/kr/search"
};

bootstrap();

async function bootstrap() {
  const providerStatus = await musicProvider.initialize();
  state.providerMode = providerStatus.mode === "appleMusic" && providerStatus.ready
    ? "appleMusic"
    : "demo";

  bindEvents();
  updateForDate(getInitialDate());
}

function bindEvents() {
  ui.elements.dateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateForDate(ui.elements.dateInput.value);
  });

  ui.elements.dateInput.addEventListener("change", () => {
    updateForDate(ui.elements.dateInput.value);
  });

  ui.elements.calendarGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (!button) return;
    updateForDate(button.dataset.date);
  });

  ui.elements.prevMonth.addEventListener("click", () => {
    const current = parseSelectedDate(state.context.date.iso);
    const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1, 12);
    updateForDate(toISODate(previous));
  });

  ui.elements.nextMonth.addEventListener("click", () => {
    const current = parseSelectedDate(state.context.date.iso);
    const next = new Date(current.getFullYear(), current.getMonth() + 1, 1, 12);
    updateForDate(toISODate(next));
  });
}

function updateForDate(dateValue) {
  const context = getEventContextFromDate(dateValue);
  const ranked = rankRecommendations(SEED_RECOMMENDATIONS.songs, context);
  const searchTerms = buildSearchTerms(context);

  state.context = context;
  state.recommendations = ensureRecommendations(ranked);
  state.appleMusicSearchUrl = buildAppleMusicSearchUrl(searchTerms, context.storefront);

  syncUrlDate(context.date.iso);
  ui.render(state);
  enrichPrimaryRecommendationLink(context.date.iso);
}

function ensureRecommendations(ranked) {
  if (ranked.length > 0) {
    return ranked;
  }

  return SEED_RECOMMENDATIONS.songs.slice(0, APP_CONFIG.maxRecommendations).map((song, index) => ({
    ...song,
    score: Math.max(1, (song.priority || 50) - index),
    scoreBreakdown: {},
    reasons: ["Fallback recommendation from the local Korean music seed catalog."]
  }));
}

function getInitialDate() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("selected-date");
  return fromUrl || APP_CONFIG.defaultDate || toISODate(new Date());
}

function syncUrlDate(isoDate) {
  const url = new URL(window.location.href);
  url.searchParams.set("selected-date", isoDate);
  window.history.replaceState({}, "", url);
}

function buildAppleMusicSearchUrl(searchTerms, storefront) {
  const term = searchTerms.slice(0, 3).join(" ");
  const region = storefront || "kr";
  return `https://music.apple.com/${encodeURIComponent(region)}/search?term=${encodeURIComponent(term)}`;
}

async function enrichPrimaryRecommendationLink(isoDate) {
  const primary = state.recommendations[0];
  if (!primary || (primary.appleMusicUrl && primary.artworkUrl)) return;

  const resolvedTrack = await resolveAppleMusicTrack(primary, state.context.storefront);
  if (state.context.date.iso !== isoDate) return;
  if (!resolvedTrack.url && !resolvedTrack.artworkUrl) return;

  state.recommendations = [
    {
      ...primary,
      appleMusicUrl: resolvedTrack.url || primary.appleMusicUrl,
      artworkUrl: resolvedTrack.artworkUrl || primary.artworkUrl
    },
    ...state.recommendations.slice(1)
  ];
  ui.render(state);
}
