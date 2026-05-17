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

const SPECIAL_DATE_LABELS = {
  "03-10": {
    tags: ["0310", "date-code-0310", "march-10", "spring-night"],
    moodTags: ["quiet", "spring", "longing", "intimate"],
    searchKeywords: ["0310", "3월10일", "백예린", "봄밤"]
  },
  "04-01": {
    tags: ["april-fools", "playful-date"],
    moodTags: ["playful", "bright", "witty"],
    searchKeywords: ["만우절", "장난", "웃음"]
  },
  "04-14": {
    tags: ["black-day", "single-life", "jjajangmyeon-day"],
    moodTags: ["single-life", "playful", "bittersweet"],
    searchKeywords: ["블랙데이", "짜장면", "솔로"]
  },
  "05-14": {
    tags: ["rose-day", "romance-date"],
    moodTags: ["romantic", "spring", "flower"],
    searchKeywords: ["로즈데이", "장미", "연애"]
  },
  "06-14": {
    tags: ["kiss-day", "romance-date"],
    moodTags: ["romantic", "sweet", "summer"],
    searchKeywords: ["키스데이", "연애", "고백"]
  },
  "10-31": {
    tags: ["halloween", "spooky-night"],
    moodTags: ["night", "playful", "dramatic"],
    searchKeywords: ["할로윈", "밤", "파티"]
  },
  "12-24": {
    tags: ["christmas-eve", "holiday-eve", "winter-romance"],
    moodTags: ["christmas", "winter", "romantic", "cozy", "anticipation"],
    searchKeywords: ["크리스마스 이브", "Christmas Eve", "캐럴", "겨울밤"]
  },
  "12-31": {
    tags: ["new-years-eve", "countdown", "year-closing"],
    moodTags: ["year-end", "farewell", "party", "reflective"],
    searchKeywords: ["새해 전야", "카운트다운", "연말"]
  }
};

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
      const isRangeContext =
        event.type === "seasonal-range" ||
        (event.type === "life-period" && event.dateRule?.kind === "month-day-range");

      if (isRangeContext) {
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

  const primaryEvent = choosePrimaryEvent(exactEvents, seasonalEvents);
  const activeEvents = [...exactEvents, ...seasonalEvents];
  const season = getSeasonName(selectedDate);
  const dateLabels = getDateLabels(selectedDate, season, exactEvents, seasonalEvents);
  const moodTags = uniqueStrings([
    season,
    ...dateLabels.moodTags,
    ...activeEvents.flatMap((event) => event.moodTags || [])
  ]);
  const searchKeywords = uniqueStrings([
    ...dateLabels.searchKeywords,
    ...activeEvents.flatMap((event) => event.searchKeywords || []),
    ...activeEvents.flatMap((event) => [
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
    ...dateLabels.tags,
    ...activeEvents.map((event) => event.id),
    ...activeEvents.flatMap((event) => event.relatedDateTags || [])
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
    dateLabels,
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

function choosePrimaryEvent(exactEvents, seasonalEvents) {
  const source = exactEvents.length > 0 ? exactEvents : seasonalEvents;
  const sorted = [...source].sort((a, b) => {
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

function getDateLabels(date, season, exactEvents, seasonalEvents) {
  const iso = toISODate(date);
  const monthDay = toMonthDay(date);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  const dateCode = `${paddedMonth}${paddedDay}`;
  const looseDateCode = `${month}${paddedDay}`;
  const dayOfWeek = date.getDay();
  const dayOfYear = getDayOfYear(date);
  const weekOfMonth = Math.ceil(day / 7);
  const monthLabel = `month-${String(month).padStart(2, "0")}`;
  const dayLabel = `day-${String(day).padStart(2, "0")}`;
  const weekdayLabel = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][dayOfWeek];
  const monthPhase = getMonthPhase(date);
  const seasonPhase = getSeasonPhase(month, day);
  const special = SPECIAL_DATE_LABELS[monthDay] || {};
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const hasHoliday = exactEvents.some((event) => event.publicHoliday);
  const hasExactCulturalEvent = exactEvents.length > 0;
  const hasSeasonalContext = seasonalEvents.length > 0;

  const tags = uniqueStrings([
    iso,
    monthDay,
    dateCode,
    looseDateCode,
    `date-code-${dateCode}`,
    "date-code-title",
    monthLabel,
    dayLabel,
    `weekday-${weekdayLabel}`,
    isWeekend ? "weekend" : "weekday",
    `week-${weekOfMonth}`,
    monthPhase,
    season,
    seasonPhase,
    ...(special.tags || []),
    `day-of-year-${dayOfYear}`,
    `rotation-${String(dayOfYear).padStart(3, "0")}`,
    hasHoliday ? "public-holiday" : "",
    hasExactCulturalEvent ? "exact-cultural-date" : "",
    hasSeasonalContext ? "seasonal-context" : ""
  ]);

  const moodTags = uniqueStrings([
    isWeekend ? "weekend" : "weekday",
    "date-code-title",
    monthPhase,
    seasonPhase,
    ...(special.moodTags || []),
    hasHoliday ? "holiday" : "",
    hasExactCulturalEvent ? "cultural-date" : ""
  ]);

  const searchKeywords = uniqueStrings([
    monthLabel,
    dayLabel,
    dateCode,
    looseDateCode,
    weekdayLabel,
    isWeekend ? "주말" : "평일",
    getMonthName(month),
    getKoreanMonthName(month),
    monthPhase,
    seasonPhase,
    ...(special.searchKeywords || [])
  ]);

  return {
    tags,
    moodTags,
    searchKeywords,
    monthLabel,
    dayLabel,
    dateCode,
    looseDateCode,
    weekdayLabel,
    monthPhase,
    seasonPhase,
    dayOfYear,
    weekOfMonth,
    isWeekend,
    hasHoliday,
    hasExactCulturalEvent,
    hasSeasonalContext
  };
}

function getDayOfYear(date) {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86400000) + 1;
}

function getMonthPhase(date) {
  const day = date.getDate();
  const lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  if (day === 1) return "month-opening";
  if (day <= 7) return "early-month";
  if (day >= lastDate - 2) return "month-closing";
  if (day >= 22) return "late-month";
  if (day >= 14 && day <= 17) return "mid-month";
  return "steady-month";
}

function getSeasonPhase(month, day) {
  const monthDay = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  if (isMonthDayInRange(monthDay, "03-01", "03-20")) return "early-spring";
  if (isMonthDayInRange(monthDay, "04-01", "04-20")) return "spring-peak";
  if (isMonthDayInRange(monthDay, "05-10", "05-31")) return "late-spring";
  if (isMonthDayInRange(monthDay, "06-01", "06-19")) return "early-summer";
  if (isMonthDayInRange(monthDay, "06-20", "07-20")) return "rainy-summer";
  if (isMonthDayInRange(monthDay, "07-21", "08-15")) return "peak-summer";
  if (isMonthDayInRange(monthDay, "08-16", "08-31")) return "late-summer";
  if (isMonthDayInRange(monthDay, "09-01", "09-23")) return "early-autumn";
  if (isMonthDayInRange(monthDay, "09-24", "10-15")) return "harvest-autumn";
  if (isMonthDayInRange(monthDay, "10-16", "11-10")) return "deep-autumn";
  if (isMonthDayInRange(monthDay, "11-11", "11-30")) return "late-autumn";
  if (isMonthDayInRange(monthDay, "12-01", "12-14")) return "early-winter";
  if (isMonthDayInRange(monthDay, "12-15", "12-31")) return "year-end";
  if (isMonthDayInRange(monthDay, "01-01", "01-12")) return "new-year";
  if (isMonthDayInRange(monthDay, "01-13", "01-31")) return "deep-winter";
  return "winter-to-spring";
}

function getMonthName(month) {
  return [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
  ][month - 1];
}

function getKoreanMonthName(month) {
  return `${month}월`;
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
