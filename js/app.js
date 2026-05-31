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
  todayContext: null,
  todayRecommendation: null,
  providerMode: "demo",
  maxRecommendations: APP_CONFIG.maxRecommendations,
  appleMusicSearchUrl: "https://music.apple.com/kr/search"
};

let mobileRecommendationScrollTimer = null;

bootstrap();

async function bootstrap() {
  const providerStatus = await musicProvider.initialize();
  state.providerMode = providerStatus.mode === "appleMusic" && providerStatus.ready
    ? "appleMusic"
    : "demo";

  bindEvents();
  updateTodayNavigation();
  updateForDate(getInitialDate());
  enrichTodayRecommendationLink();
}

function bindEvents() {
  ui.elements.dateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateForDate(ui.elements.dateInput.value);
  });

  ui.elements.dateInput.addEventListener("change", () => {
    updateForDate(ui.elements.dateInput.value);
    setDateFormVisibility(false);
  });

  ui.elements.dateInput.addEventListener("blur", () => {
    setDateFormVisibility(false);
  });

  ui.elements.topDateButton.addEventListener("click", () => {
    if (!state.todayContext) return;
    updateForDate(state.todayContext.date.iso);
  });

  ui.elements.selectedDateTitle.addEventListener("click", () => {
    openNativeDatePicker();
  });

  ui.elements.selectedDateTitle.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openNativeDatePicker();
  });

  document.addEventListener("click", (event) => {
    if (!ui.elements.dateForm.classList.contains("date-form--visible")) return;
    if (ui.elements.dateForm.contains(event.target)) return;
    if (ui.elements.selectedDateTitle.contains(event.target)) return;

    setDateFormVisibility(false);
  });

  ui.elements.calendarGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (!button) return;
    updateForDate(button.dataset.date);
    scheduleMobileRecommendationScroll(button.dataset.date);
  });

  ui.elements.calendarGrid.addEventListener("pointermove", updateCalendarHover);
  ui.elements.calendarGrid.addEventListener("pointerleave", clearCalendarHover);
  document.addEventListener("pointerup", resetMobileTapState, true);
  document.addEventListener("click", resetMobileTapState, true);

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

function updateTodayNavigation() {
  const todayContext = getEventContextFromDate(toISODate(new Date()));
  const todayRecommendations = ensureRecommendations(rankRecommendations(SEED_RECOMMENDATIONS.songs, todayContext));

  state.todayContext = todayContext;
  state.todayRecommendation = todayRecommendations[0] || null;
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

function scheduleMobileRecommendationScroll(isoDate) {
  window.clearTimeout(mobileRecommendationScrollTimer);

  if (!window.matchMedia("(max-width: 1120px)").matches) return;

  mobileRecommendationScrollTimer = window.setTimeout(() => {
    if (state.context?.date?.iso !== isoDate) return;

    ui.elements.recommendationsPanel?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
  }, 850);
}

function setDateFormVisibility(visible) {
  ui.elements.dateForm.classList.toggle("date-form--visible", visible);
  ui.elements.selectedDateTitle.setAttribute("aria-expanded", String(visible));

  if (visible) {
    ui.elements.dateInput.focus();
  }
}

function openNativeDatePicker() {
  ui.elements.dateForm.classList.add("date-form--visible");
  ui.elements.selectedDateTitle.setAttribute("aria-expanded", "true");
  ui.elements.dateInput.focus({ preventScroll: true });

  if (typeof ui.elements.dateInput.showPicker === "function") {
    try {
      ui.elements.dateInput.showPicker();
      return;
    } catch {
      // Some browsers require a visible/native click fallback for date inputs.
    }
  }

  ui.elements.dateInput.click();
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
  return toISODate(new Date());
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

async function enrichTodayRecommendationLink() {
  const todayRecommendation = state.todayRecommendation;
  if (!todayRecommendation || (todayRecommendation.appleMusicUrl && todayRecommendation.artworkUrl)) return;

  const resolvedTrack = await resolveAppleMusicTrack(
    todayRecommendation,
    state.todayContext?.storefront || "kr"
  );
  if (!resolvedTrack.url && !resolvedTrack.artworkUrl) return;

  state.todayRecommendation = {
    ...todayRecommendation,
    appleMusicUrl: resolvedTrack.url || todayRecommendation.appleMusicUrl,
    artworkUrl: resolvedTrack.artworkUrl || todayRecommendation.artworkUrl
  };

  if (state.context) {
    ui.render(state);
  }
}

function updateCalendarHover(event) {
  if (isTouchViewport()) {
    clearCalendarHover();
    return;
  }

  if (!ui.elements.calendarGrid.contains(event.target)) {
    clearCalendarHover();
    return;
  }

  ui.elements.calendarGrid.querySelectorAll("[data-calendar-index]").forEach((button) => {
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
    const maxRadius = Math.max(rect.width, rect.height) * 2.15;
    const proximity = Math.max(0, 1 - distance / maxRadius);

    if (proximity <= 0) {
      resetCalendarButtonHover(button);
      return;
    }

    const easedProximity = proximity * proximity * (3 - 2 * proximity);
    const scale = 1 + easedProximity * 0.095;

    button.classList.add("date-cell--magnetic");
    button.style.setProperty("--date-hover-scale", scale.toFixed(3));
  });
}

function clearCalendarHover() {
  ui.elements.calendarGrid.querySelectorAll(".date-cell--magnetic").forEach(resetCalendarButtonHover);
}

function resetCalendarButtonHover(button) {
  button.classList.remove("date-cell--magnetic");
  button.style.removeProperty("--date-hover-scale");
}

function resetMobileTapState(event) {
  if (!isTouchViewport()) return;

  const target = event.target.closest("a, button, [role='button']");
  if (!target) return;

  // Keep the native date picker stable; blurring its trigger/input can close it immediately.
  if (
    target === ui.elements.selectedDateTitle ||
    target === ui.elements.dateInput ||
    ui.elements.dateForm.contains(target)
  ) {
    return;
  }

  window.setTimeout(() => {
    clearCalendarHover();

    if (typeof target.blur === "function") {
      target.blur();
    }

    if (
      document.activeElement instanceof HTMLElement &&
      (target === document.activeElement || target.contains(document.activeElement))
    ) {
      document.activeElement.blur();
    }
  }, 90);
}

function isTouchViewport() {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}
