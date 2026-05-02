import { buildAppleMusicLink } from "./appleMusicService.js";
import { renderCalendarGrid } from "./calendarView.js";

const EVENT_ROUTE_MAP = {
  "hangeul-day": "H",
  chuseok: "C",
  seollal: "S",
  "childrens-day": "K",
  "parents-day": "F",
  "memorial-day": "M",
  "liberation-day": "L",
  "independence-movement-day": "I"
};

export function createUIRenderer(root = document) {
  const $ = (selector) => root.querySelector(selector);
  const elements = {
    selectedDateTitle: $('[data-js="selected-date-title"]'),
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
  elements.musicModeLabel.textContent = state.providerMode === "appleMusic" ? "Apple Music" : "Demo Mode";
  elements.dateInput.value = state.context.date.iso;
}

function renderCalendar(elements, state) {
  const calendar = renderCalendarGrid({
    selectedDate: state.context.date.iso,
    events: state.events
  });

  elements.calendarMonthLabel.textContent = calendar.monthLabel;
  elements.calendarGrid.innerHTML = calendar.cells.map((cell) => {
    const classes = [
      "date-cell",
      cell.inMonth ? "" : "date-cell--muted",
      cell.event ? "date-cell--event" : "",
      cell.seasonal ? "date-cell--season" : "",
      cell.selected ? "date-cell--selected" : ""
    ].filter(Boolean).join(" ");
    const current = cell.selected ? ' aria-current="date"' : "";
    const eventLabel = cell.labelText ? `, ${escapeHtml(cell.labelText)}` : "";

    return `<button type="button" class="${classes}" data-date="${cell.iso}" aria-label="${cell.iso}${eventLabel}"${current}>${cell.label}</button>`;
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

  elements.recommendationList.innerHTML = recommendations.map((item, index) => {
    const chips = buildReasonChips(item, state.context);
    const link = buildAppleMusicLink(item);

    return `
      <li class="recommendation-card">
        <div class="track-main">
          <p class="track-kicker">${escapeHtml(index === 0 ? "Best match" : getRecommendationLabel(item))}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <p class="track-artist">${escapeHtml(item.artist)}</p>
          <div class="reason-row" aria-label="Recommendation reasons">
            ${chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join("")}
          </div>
        </div>
        <div class="score-block" aria-label="Recommendation score">
          <span class="score-block__value">${Math.round(item.score)}</span>
          <span class="score-block__label">score</span>
          <a class="track-link" href="${escapeAttribute(link)}" target="_blank" rel="noreferrer">Apple Music</a>
        </div>
      </li>
    `;
  }).join("");
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
  const primary = context.primaryEvent?.labels?.ko;
  return [
    primary,
    ...item.moodTags.filter((tag) => context.moodTags.includes(tag)),
    ...item.eventTags.filter((tag) => context.relatedDateTags.includes(tag)),
    ...item.dateTags.filter((tag) => context.relatedDateTags.includes(tag))
  ].filter(Boolean).slice(0, 4);
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
