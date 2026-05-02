import {
  daysBetween,
  formatKoreanDate,
  getSeasonName,
  isDateInISODateRange,
  isMonthDayInRange,
  parseSelectedDate,
  toISODate,
  toMonthDay,
  uniqueStrings
} from "./dateUtils.js";
import { getEventsData } from "./localDataRegistry.js";

const NEARBY_EVENT_WINDOW_DAYS = 7;

export function getEventContextFromDate(date) {
  const selectedDate = parseSelectedDate(date);
  const eventData = getEventsData();
  const events = Array.isArray(eventData.events) ? eventData.events : [];
  const exactEvents = [];
  const seasonalEvents = [];
  const nearbyEvents = [];

  for (const event of events) {
    const match = getEventMatch(event, selectedDate);

    if (match.isExact) {
      if (event.type === "seasonal-range" || event.type === "life-period") {
        seasonalEvents.push({ ...event, match });
      } else {
        exactEvents.push({ ...event, match });
      }
      continue;
    }

    if (match.nearbyDistance !== null && match.nearbyDistance <= NEARBY_EVENT_WINDOW_DAYS) {
      nearbyEvents.push({ ...event, match });
    }
  }

  const primaryEvent = choosePrimaryEvent(exactEvents, seasonalEvents, nearbyEvents);
  const allMatchedEvents = [...exactEvents, ...seasonalEvents, ...nearbyEvents];
  const season = getSeasonName(selectedDate);
  const moodTags = uniqueStrings([
    season,
    ...allMatchedEvents.flatMap((event) => event.moodTags || [])
  ]);
  const searchKeywords = uniqueStrings([
    ...allMatchedEvents.flatMap((event) => event.searchKeywords || []),
    ...allMatchedEvents.flatMap((event) => [
      event.labels?.ko,
      event.labels?.en,
      event.id
    ]),
    season
  ]);
  const relatedDateTags = uniqueStrings([
    toISODate(selectedDate),
    toMonthDay(selectedDate),
    season,
    ...allMatchedEvents.map((event) => event.id),
    ...allMatchedEvents.flatMap((event) => event.relatedDateTags || [])
  ]);

  return {
    date: {
      value: selectedDate,
      iso: toISODate(selectedDate),
      monthDay: toMonthDay(selectedDate),
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
      day: selectedDate.getDate(),
      labelKo: formatKoreanDate(selectedDate)
    },
    locale: eventData.locale || "ko-KR",
    storefront: eventData.storefront || "kr",
    season,
    primaryEvent,
    exactEvents,
    seasonalEvents,
    nearbyEvents: nearbyEvents.sort(sortByNearbyDistanceThenWeight),
    moodTags,
    searchKeywords,
    relatedDateTags,
    isPublicHoliday: exactEvents.some((event) => event.publicHoliday),
    hasExactEvent: exactEvents.length > 0,
    hasSeasonalEvent: seasonalEvents.length > 0
  };
}

function getEventMatch(event, selectedDate) {
  const rule = event.dateRule || {};

  if (rule.kind === "month-day") {
    const isExact = toMonthDay(selectedDate) === rule.monthDay;
    return {
      isExact,
      nearbyDistance: isExact ? 0 : distanceToMonthDay(selectedDate, rule.monthDay),
      matchedDate: rule.monthDay
    };
  }

  if (rule.kind === "month-day-range") {
    const monthDay = toMonthDay(selectedDate);
    const isExact = isMonthDayInRange(monthDay, rule.startMonthDay, rule.endMonthDay);
    return {
      isExact,
      nearbyDistance: isExact
        ? 0
        : distanceToMonthDayRange(selectedDate, rule.startMonthDay, rule.endMonthDay),
      matchedDate: isExact ? `${rule.startMonthDay}/${rule.endMonthDay}` : null
    };
  }

  if (rule.kind === "single-date-by-year") {
    const yearEntry = rule.datesByYear?.[String(selectedDate.getFullYear())];
    if (!yearEntry?.mainDate) {
      return noMatch();
    }

    const isExact =
      toISODate(selectedDate) === yearEntry.mainDate ||
      (yearEntry.observedDates || []).includes(toISODate(selectedDate));

    return {
      isExact,
      nearbyDistance: Math.abs(daysBetween(selectedDate, parseSelectedDate(yearEntry.mainDate))),
      matchedDate: yearEntry.mainDate
    };
  }

  if (rule.kind === "date-range-by-year") {
    const yearEntry = rule.datesByYear?.[String(selectedDate.getFullYear())];
    if (!yearEntry?.start || !yearEntry?.end) {
      return noMatch();
    }

    const isExact =
      isDateInISODateRange(selectedDate, yearEntry.start, yearEntry.end) ||
      (yearEntry.observedDates || []).includes(toISODate(selectedDate));
    const mainDate = parseSelectedDate(yearEntry.mainDate || yearEntry.start);

    return {
      isExact,
      nearbyDistance: isExact ? 0 : Math.abs(daysBetween(selectedDate, mainDate)),
      matchedDate: yearEntry.mainDate || yearEntry.start,
      range: {
        start: yearEntry.start,
        end: yearEntry.end
      }
    };
  }

  return noMatch();
}

function choosePrimaryEvent(exactEvents, seasonalEvents, nearbyEvents) {
  const sorted = [...exactEvents, ...seasonalEvents, ...nearbyEvents].sort((a, b) => {
    const distanceDelta = (a.match.nearbyDistance || 0) - (b.match.nearbyDistance || 0);
    if (distanceDelta !== 0) return distanceDelta;

    return (b.weight || 0) - (a.weight || 0);
  });

  const event = sorted[0];
  if (!event) return null;

  return {
    id: event.id,
    type: event.type,
    labels: event.labels,
    publicHoliday: Boolean(event.publicHoliday),
    weight: event.weight || 0,
    moodTags: event.moodTags || [],
    searchKeywords: event.searchKeywords || [],
    relatedDateTags: event.relatedDateTags || [],
    match: event.match
  };
}

function distanceToMonthDay(selectedDate, monthDay) {
  if (!monthDay) return null;

  const [month, day] = monthDay.split("-").map(Number);
  const year = selectedDate.getFullYear();
  const candidates = [
    new Date(year - 1, month - 1, day, 12),
    new Date(year, month - 1, day, 12),
    new Date(year + 1, month - 1, day, 12)
  ];

  return Math.min(...candidates.map((candidate) => Math.abs(daysBetween(selectedDate, candidate))));
}

function distanceToMonthDayRange(selectedDate, startMonthDay, endMonthDay) {
  return Math.min(
    distanceToMonthDay(selectedDate, startMonthDay),
    distanceToMonthDay(selectedDate, endMonthDay)
  );
}

function sortByNearbyDistanceThenWeight(a, b) {
  const distanceDelta = (a.match.nearbyDistance || 0) - (b.match.nearbyDistance || 0);
  if (distanceDelta !== 0) return distanceDelta;

  return (b.weight || 0) - (a.weight || 0);
}

function noMatch() {
  return {
    isExact: false,
    nearbyDistance: null,
    matchedDate: null
  };
}
