import { buildAppleMusicLink } from "./appleMusicService.js";
import { renderCalendarGrid } from "./calendarView.js";
import { buildFallbackArtworkUrl } from "./appleMusicFallbacks.js";

const EVENT_ROUTE_MAP = {
  "hangeul-day": "H",
  chuseok: "C",
  seollal: "S",
  "childrens-day": "K",
  "parents-day": "F",
  "teachers-day": "T",
  "memorial-day": "M",
  "liberation-day": "L",
  "independence-movement-day": "I"
};

const FEATURED_OCCASION_IDS = new Set([
  "childrens-day",
  "parents-day",
  "teachers-day",
  "valentines-day",
  "white-day",
  "black-day",
  "rose-day",
  "kiss-day",
  "pepero-day",
  "hangeul-day",
  "memorial-day",
  "liberation-day",
  "independence-movement-day",
  "constitution-day",
  "halloween",
  "christmas-eve",
  "christmas",
  "new-years-eve",
  "new-years-day"
]);

export function createUIRenderer(root = document) {
  const $ = (selector) => root.querySelector(selector);
  root.addEventListener("error", handleArtworkLoadError, true);
  const elements = {
    selectedDateTitle: $('[data-js="selected-date-title"]'),
    topDateButton: $('[data-js="top-date-button"]'),
    topSongLabel: $('[data-js="top-song-label"]'),
    topSongLink: $('[data-js="top-song-link"]'),
    musicModeLabel: $('[data-js="music-mode-label"]'),
    dateForm: $('[data-js="date-form"]'),
    dateInput: $('[data-js="date-input"]'),
    prevMonth: $('[data-js="prev-month"]'),
    nextMonth: $('[data-js="next-month"]'),
    calendarMonthLabel: $('[data-js="calendar-month-label"]'),
    calendarGrid: $('[data-js="calendar-grid"]'),
    eventRoute: $('[data-js="event-route"]'),
    eventSummary: $('[data-js="event-summary"]'),
    contextList: $('[data-js="context-list"]'),
    recommendationsPanel: $(".recommendations-panel"),
    recommendationList: $('[data-js="recommendation-list"]'),
    appleMusicStatus: $('[data-js="apple-music-status"]'),
    appleMusicSearchLink: $('[data-js="apple-music-search-link"]'),
    appleMusicActionArea: $('[data-js="apple-music-action-area"]')
  };

  return {
    elements,
    render(state) {
      renderHeader(elements, state);
      renderCalendar(elements, state);
      if (elements.eventSummary && elements.contextList) {
        renderContext(elements, state);
      }
      renderRecommendations(elements, state);
      if (elements.appleMusicStatus && elements.appleMusicActionArea) {
        renderMusicArea(elements, state);
      }
    }
  };
}

function renderHeader(elements, state) {
  const dateTitle = new Intl.DateTimeFormat("en-US", {
    month: "short"
  }).format(state.context.date.value).toUpperCase();
  const day = String(state.context.date.day).padStart(2, "0");

  elements.selectedDateTitle.textContent = `${dateTitle} ${day} ${state.context.date.year}`;
  if (elements.topDateButton) {
    const today = state.todayContext?.date || state.context.date;
    const todayDay = String(today.day).padStart(2, "0");
    const monthName = new Intl.DateTimeFormat("en-US", {
      month: "short"
    }).format(today.value);
    elements.topDateButton.textContent = `Today: ${monthName} ${todayDay} ${today.year}`;
  }
  elements.musicModeLabel.textContent = state.providerMode === "appleMusic" ? "Apple Music" : "Demo Mode";
  elements.dateInput.value = state.context.date.iso;
}

function renderCalendar(elements, state) {
  const calendar = renderCalendarGrid({
    selectedDate: state.context.date.iso,
    events: state.events
  });

  elements.calendarMonthLabel.textContent = calendar.monthLabel;
  elements.calendarGrid.innerHTML = calendar.cells.map((cell, index) => {
    const classes = [
      "date-cell",
      cell.inMonth ? "" : "date-cell--muted",
      cell.publicHoliday ? "date-cell--holiday" : "",
      cell.eventDay ? "date-cell--event" : "",
      cell.selected ? "date-cell--selected" : ""
    ].filter(Boolean).join(" ");
    const current = cell.selected ? ' aria-current="date"' : "";
    const eventLabel = cell.labelText ? `, ${escapeHtml(cell.labelText)}` : "";

    return `<button type="button" class="${classes}" data-date="${cell.iso}" data-calendar-index="${index}" aria-label="${cell.iso}${eventLabel}"${current}>${cell.label}</button>`;
  }).join("");
}

function renderContext(elements, state) {
  const context = state.context;
  const primary = context.primaryEvent;
  const eventName = getPrimaryName(context);
  const route = primary ? EVENT_ROUTE_MAP[primary.id] || primary.labels?.en?.charAt(0) || "D" : "D";

  elements.eventRoute.textContent = route.toUpperCase();
  elements.eventSummary.innerHTML = `
    <p class="summary-label">Primary context</p>
    <h3>${escapeHtml(eventName)}</h3>
    <p>${escapeHtml(buildEventSummary(context))}</p>
  `;

  elements.contextList.innerHTML = [
    ["Event type", primary ? formatEventType(primary.type, primary.publicHoliday) : "Seasonal date"],
    ["Season", translateSeason(context.season)],
    ["Mood", context.moodTags.slice(0, 5).join(" · ")],
    ["Search terms", context.searchKeywords.slice(0, 6).join(" · ")]
  ].map(([term, detail]) => `
    <div>
      <dt>${escapeHtml(term)}</dt>
      <dd>${escapeHtml(detail)}</dd>
    </div>
  `).join("");
}

function renderRecommendations(elements, state) {
  const recommendations = state.recommendations.slice(0, state.maxRecommendations);
  const todayRecommendation = state.todayRecommendation;

  if (elements.topSongLabel) {
    const todaySongText = todayRecommendation
      ? `${todayRecommendation.title} - ${todayRecommendation.artist}`
      : "Recommendation Song";
    elements.topSongLabel.textContent = todaySongText;
    elements.topSongLabel.dataset.marqueeText = todaySongText;
  }

  if (elements.topSongLink) {
    elements.topSongLink.href = todayRecommendation
      ? buildAppleMusicLink(todayRecommendation)
      : "https://music.apple.com/kr/search";
  }

  elements.recommendationList.innerHTML = recommendations.map((item, index) => {
    const occasion = getFeaturedOccasion(state.context);
    const reason = buildRecommendationNarrative(item, state.context, occasion);
    const link = buildAppleMusicLink(item);

    return `
      <li class="recommendation-card">
        ${renderArtwork(item)}
        <div class="track-main">
          <p class="track-kicker">${escapeHtml(index === 0 ? "Best match" : getRecommendationLabel(item))}</p>
          ${occasion ? `<p class="occasion-label">${escapeHtml(occasion)}</p>` : ""}
          <h3>${escapeHtml(item.title)}</h3>
          <p class="track-artist">${escapeHtml(item.artist)}</p>
          <p class="track-reason">${escapeHtml(reason)}</p>
        </div>
        <div class="score-block" aria-label="Apple Music action">
          <a class="track-link" href="${escapeAttribute(link)}" target="_blank" rel="noreferrer">Apple Music</a>
        </div>
      </li>
    `;
  }).join("");
}

function renderArtwork(item) {
  const fallbackArtworkUrl = buildFallbackArtworkUrl(item);

  if (item.artworkUrl) {
    return `
      <figure class="album-art">
        <img
          src="${escapeAttribute(item.artworkUrl)}"
          alt="${escapeAttribute(`${item.title} album cover`)}"
          loading="eager"
          decoding="async"
          fetchpriority="high"
          referrerpolicy="no-referrer"
          data-fallback-artwork="${escapeAttribute(fallbackArtworkUrl)}"
        >
      </figure>
    `;
  }

  return `
    <figure class="album-art album-art--placeholder" aria-label="Album cover loading">
      <span>${escapeHtml(getArtworkInitials(item))}</span>
    </figure>
  `;
}

function getArtworkInitials(item) {
  return String(item.title || item.artist || "♪").trim().slice(0, 2).toUpperCase();
}

function handleArtworkLoadError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.closest(".album-art")) return;
  if (!image.dataset.fallbackArtwork || image.dataset.fallbackApplied === "true") return;

  image.dataset.fallbackApplied = "true";
  image.src = image.dataset.fallbackArtwork;
}

function renderMusicArea(elements, state) {
  const fallbackCopy = state.providerMode === "appleMusic"
    ? "MusicKit is configured. Catalog links open in Apple Music; full playback may require user authorization."
    : "Demo mode is active. Recommendations use local Korean cultural data and open Apple Music search links when selected.";

  elements.appleMusicStatus.textContent = state.providerMode === "appleMusic" ? "Connected" : "Demo fallback";
  elements.appleMusicSearchLink.href = state.appleMusicSearchUrl;
  elements.appleMusicActionArea.querySelector("p").textContent = fallbackCopy;
}

function buildReasonChips(item, context) {
  const primary = getFeaturedOccasion(context);
  return [
    primary,
    ...item.moodTags.filter((tag) => context.moodTags.includes(tag)),
    ...item.eventTags.filter((tag) => context.relatedDateTags.includes(tag)),
    ...item.dateTags.filter((tag) => context.relatedDateTags.includes(tag))
  ].filter(Boolean).slice(0, 4);
}

function buildRecommendationNarrative(item, context, occasion) {
  if ((item.scoreBreakdown?.lyricDateTextMatch || 0) > 0 && item.lyricDateExcerpt) {
    return `가사에 오늘 날짜와 맞닿는 소절이 있습니다: "${cleanReasonText(item.lyricDateExcerpt)}".`;
  }

  if (occasion && hasEventMatch(item, context)) {
    return `${occasion}에 맞춰 고른 곡입니다. ${cleanReasonText(item.lyricHint || item.notes || "이 날짜의 문화적 분위기와 노래의 정서가 직접 연결됩니다.")}`;
  }

  if ((item.scoreBreakdown?.directDateTextMatch || 0) > 0) {
    return `${cleanReasonText(item.lyricHint || item.notes || "제목이나 설명 안에 선택한 날짜가 직접 등장해 날짜성이 강합니다.")}`;
  }

  const firstReason = (item.reasons || []).find((reason) => !reason.includes("Korean-language"));
  if (firstReason) {
    return translateReason(firstReason, item, context);
  }

  return `${translateSeason(context.season)}의 분위기와 ${item.artist}의 곡 색이 맞아 오늘의 보조 추천으로 배치했습니다.`;
}

function getFeaturedOccasion(context) {
  const exactEvents = context.exactEvents || [];
  const featured = exactEvents.filter((event) => {
    return event.publicHoliday || FEATURED_OCCASION_IDS.has(event.id) || event.type === "fixed-date";
  });

  return featured
    .map((event) => event.labels?.ko || event.id)
    .filter(Boolean)
    .join(" · ");
}

function hasEventMatch(item, context) {
  const exactIds = (context.exactEvents || []).map((event) => event.id);
  return (item.eventTags || []).some((tag) => exactIds.includes(tag));
}

function cleanReasonText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function translateReason(reason, item, context) {
  if (reason.includes("directly references")) {
    return cleanReasonText(item.lyricHint || "제목이나 설명 안에 선택한 날짜가 직접 등장합니다.");
  }

  if (reason.includes("Selected date matches")) {
    return `선택한 날짜와 곡의 날짜 태그가 맞습니다. ${cleanReasonText(item.lyricHint || "")}`.trim();
  }

  if (reason.includes("Connected to")) {
    return `오늘의 기념일 맥락과 연결됩니다. ${cleanReasonText(item.lyricHint || "")}`.trim();
  }

  return `${translateSeason(context.season)}의 날짜감과 곡의 분위기가 맞습니다. ${cleanReasonText(item.lyricHint || "")}`.trim();
}

function buildEventSummary(context) {
  const primary = context.primaryEvent;
  if (primary) {
    const label = primary.labels?.ko || primary.id;
    const holiday = primary.publicHoliday ? "공휴일" : "문화적 기준일";
    return `${label} is interpreted as a ${holiday} or date marker. The engine prioritizes ${context.moodTags.slice(0, 4).join(", ")} tracks and Korean cultural relevance.`;
  }

  return `No fixed holiday is attached to this date, so the engine leans on ${translateSeason(context.season)} seasonality, nearby events, and Korean listening moods.`;
}

function getPrimaryName(context) {
  return context.primaryEvent?.labels?.ko || `${translateSeason(context.season)} mood`;
}

function getRecommendationLabel(item) {
  if ((item.scoreBreakdown?.exactDateMatch || 0) > 0) return "Date match";
  if ((item.scoreBreakdown?.eventKeywordMatch || 0) > 0) return "Event signal";
  if ((item.scoreBreakdown?.moodSeasonMatch || 0) > 0) return "Mood alignment";
  return "Fallback";
}

function formatEventType(type, publicHoliday) {
  const typeLabel = {
    "fixed-date": "Fixed-date event",
    "seasonal-range": "Seasonal range",
    "life-period": "Life period",
    "year-specific": "Year-specific lunar event"
  }[type] || type;

  return publicHoliday ? `${typeLabel} · Public holiday` : typeLabel;
}

function translateSeason(season) {
  return {
    spring: "봄",
    summer: "여름",
    autumn: "가을",
    winter: "겨울"
  }[season] || season;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
