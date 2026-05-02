import {
  containsKoreanText,
  countIntersections,
  normalizeText,
  uniqueStrings
} from "./dateUtils.js";
import { getSeedRecommendationsData } from "./localDataRegistry.js";

const SCORE_WEIGHTS = {
  directDateTextMatch: 120,
  exactDateMatch: 50,
  eventKeywordMatch: 40,
  titleMatch: 30,
  lyricHintOrManualTagMatch: 20,
  moodSeasonMatch: 15,
  koreanLanguageBoost: 10,
  koreanArtistBoost: 8,
  mismatchPenalty: -15
};

const MOOD_CONFLICTS = {
  solemn: ["party", "playful", "dance", "bright"],
  reflective: ["party"],
  memorial: ["party", "playful"],
  exam: ["party"],
  family: ["breakup"],
  romantic: ["solemn", "memorial"],
  bright: ["solemn"]
};

export function buildSearchTerms(context) {
  const primary = context.primaryEvent;
  const eventLabels = primary ? [primary.labels?.ko, primary.labels?.en] : [];
  const exactEventKeywords = context.exactEvents.flatMap((event) => event.searchKeywords || []);
  const seasonalKeywords = context.seasonalEvents.flatMap((event) => event.searchKeywords || []);

  return uniqueStrings([
    ...eventLabels,
    ...exactEventKeywords,
    ...seasonalKeywords,
    ...context.searchKeywords,
    ...context.moodTags,
    ...buildDateReferenceTerms(context),
    context.season,
    context.date.monthDay,
    context.date.iso
  ]).filter((term) => String(term).length > 1);
}

export function scoreCandidate(candidate, context) {
  const breakdown = getScoreBreakdown(candidate, context);
  return Object.values(breakdown).reduce((total, value) => total + value, 0);
}

export function rankRecommendations(candidates, context) {
  const list = candidates || getSeedRecommendationsData().songs || [];

  return list
    .map((candidate) => {
      const scoreBreakdown = getScoreBreakdown(candidate, context);
      const score = Object.values(scoreBreakdown).reduce((total, value) => total + value, 0);

      return {
        ...candidate,
        score,
        scoreBreakdown,
        reasons: buildRecommendationReasons(candidate, context)
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.priority || 0) - (a.priority || 0);
    });
}

export function buildRecommendationReasons(candidate, context) {
  const reasons = [];
  const exactTags = getExactDateTags(context);
  const candidateTags = getCandidateTags(candidate);
  const eventIds = getContextEventIds(context);
  const candidateEventMatches = (candidate.eventTags || []).filter((tag) => eventIds.includes(tag));
  const dateMatches = (candidate.dateTags || []).filter((tag) => exactTags.includes(tag));
  const moodMatches = (candidate.moodTags || []).filter((tag) => context.moodTags.includes(tag));

  if (hasDirectDateTextMatch(candidate, context)) {
    reasons.push("Title or lyric hint directly references the selected date.");
  }

  if (dateMatches.length > 0) {
    reasons.push(`Selected date matches ${formatList(dateMatches)}.`);
  }

  if (candidateEventMatches.length > 0) {
    reasons.push(`Connected to ${formatEventNames(candidateEventMatches, context)}.`);
  }

  const titleKeyword = findTitleKeyword(candidate, context);
  if (titleKeyword) {
    reasons.push(`The title directly echoes "${titleKeyword}".`);
  }

  const manualTagMatches = candidateTags.filter((tag) => {
    return (
      context.relatedDateTags.includes(tag) ||
      context.moodTags.includes(tag) ||
      context.searchKeywords.map(normalizeText).includes(normalizeText(tag))
    );
  });

  if (manualTagMatches.length > 0) {
    reasons.push(`Its tags fit the date context: ${formatList(uniqueStrings(manualTagMatches).slice(0, 4))}.`);
  }

  if (moodMatches.length > 0) {
    reasons.push(`Mood match: ${formatList(moodMatches.slice(0, 4))}.`);
  }

  if (isKoreanLanguageCandidate(candidate)) {
    reasons.push("Korean-language track suitable for a Korean cultural recommendation.");
  }

  if (isKoreanArtistCandidate(candidate)) {
    reasons.push("Artist metadata has a strong Korean music signal.");
  }

  if (hasMismatch(candidate, context)) {
    reasons.push("Some tags are less aligned with the selected date, so the score is reduced.");
  }

  if (reasons.length === 0) {
    reasons.push("Recommended as a fallback based on general priority and broad seasonal fit.");
  }

  return reasons;
}

function getScoreBreakdown(candidate, context) {
  const directDateTextMatch = hasDirectDateTextMatch(candidate, context)
    ? SCORE_WEIGHTS.directDateTextMatch
    : 0;
  const exactDateMatch = hasExactDateMatch(candidate, context)
    ? SCORE_WEIGHTS.exactDateMatch
    : 0;
  const eventKeywordMatch = hasEventKeywordMatch(candidate, context)
    ? SCORE_WEIGHTS.eventKeywordMatch
    : 0;
  const titleMatch = findTitleKeyword(candidate, context)
    ? SCORE_WEIGHTS.titleMatch
    : 0;
  const lyricHintOrManualTagMatch = hasLyricHintOrManualTagMatch(candidate, context)
    ? SCORE_WEIGHTS.lyricHintOrManualTagMatch
    : 0;
  const moodSeasonMatch = hasMoodSeasonMatch(candidate, context)
    ? SCORE_WEIGHTS.moodSeasonMatch
    : 0;
  const koreanLanguageBoost = isKoreanLanguageCandidate(candidate)
    ? SCORE_WEIGHTS.koreanLanguageBoost
    : 0;
  const koreanArtistBoost = isKoreanArtistCandidate(candidate)
    ? SCORE_WEIGHTS.koreanArtistBoost
    : 0;
  const mismatchPenalty = hasMismatch(candidate, context)
    ? SCORE_WEIGHTS.mismatchPenalty
    : 0;

  return {
    directDateTextMatch,
    exactDateMatch,
    eventKeywordMatch,
    titleMatch,
    lyricHintOrManualTagMatch,
    moodSeasonMatch,
    koreanLanguageBoost,
    koreanArtistBoost,
    mismatchPenalty
  };
}

function hasDirectDateTextMatch(candidate, context) {
  const haystack = normalizeText([
    candidate.title,
    candidate.lyricHint,
    candidate.notes,
    candidate.appleMusicSearchTerm
  ].join(" "));

  return buildDateReferenceTerms(context).some((term) => {
    const normalized = normalizeText(term);
    return normalized.length > 1 && haystack.includes(normalized);
  });
}

function hasExactDateMatch(candidate, context) {
  const exactTags = getExactDateTags(context);
  return (candidate.dateTags || []).some((tag) => exactTags.includes(tag));
}

function hasEventKeywordMatch(candidate, context) {
  const eventIds = getContextEventIds(context);
  const eventTagMatch = (candidate.eventTags || []).some((tag) => eventIds.includes(tag));
  if (eventTagMatch) return true;

  const haystack = normalizeText([
    candidate.appleMusicSearchTerm,
    candidate.title,
    candidate.artist,
    candidate.notes
  ].join(" "));

  return context.searchKeywords.some((keyword) => haystack.includes(normalizeText(keyword)));
}

function findTitleKeyword(candidate, context) {
  const title = normalizeText(candidate.title);
  const titleKeywords = uniqueStrings([
    ...buildDateReferenceTerms(context),
    ...context.searchKeywords,
    context.primaryEvent?.labels?.ko,
    context.primaryEvent?.labels?.en,
    context.season
  ]);

  return titleKeywords.find((keyword) => {
    const normalized = normalizeText(keyword);
    return normalized.length > 1 && title.includes(normalized);
  });
}

function buildDateReferenceTerms(context) {
  const monthNames = [
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
  ];
  const shortMonthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec"
  ];
  const month = context.date.month;
  const day = context.date.day;
  const monthName = monthNames[month - 1];
  const shortMonthName = shortMonthNames[month - 1];
  const ordinal = getOrdinal(day);

  return uniqueStrings([
    context.date.iso,
    context.date.monthDay,
    `${month}-${day}`,
    `${month}.${day}`,
    `${month}/${day}`,
    `${month}월 ${day}일`,
    `${month}월${day}일`,
    `${monthName} ${day}`,
    `${monthName} ${ordinal}`,
    `${shortMonthName} ${day}`,
    `${day} ${monthName}`,
    `${day} ${shortMonthName}`
  ]);
}

function getOrdinal(day) {
  const mod10 = day % 10;
  const mod100 = day % 100;

  if (mod10 === 1 && mod100 !== 11) return `${day}st`;
  if (mod10 === 2 && mod100 !== 12) return `${day}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${day}rd`;
  return `${day}th`;
}

function hasLyricHintOrManualTagMatch(candidate, context) {
  const candidateTags = getCandidateTags(candidate);
  const contextTags = uniqueStrings([
    ...context.relatedDateTags,
    ...context.moodTags,
    ...getContextEventIds(context)
  ]);
  const manualTagMatch = countIntersections(candidateTags, contextTags) > 0;
  if (manualTagMatch) return true;

  const lyricAndNotes = normalizeText(`${candidate.lyricHint || ""} ${candidate.notes || ""}`);
  return context.searchKeywords.some((keyword) => {
    const normalized = normalizeText(keyword);
    return normalized.length > 1 && lyricAndNotes.includes(normalized);
  });
}

function hasMoodSeasonMatch(candidate, context) {
  const moodTags = candidate.moodTags || [];
  return moodTags.includes(context.season) || countIntersections(moodTags, context.moodTags) > 0;
}

function isKoreanLanguageCandidate(candidate) {
  return (
    candidate.locale === "ko-KR" ||
    containsKoreanText(candidate.title) ||
    containsKoreanText(candidate.lyricHint) ||
    containsKoreanText(candidate.appleMusicSearchTerm)
  );
}

function isKoreanArtistCandidate(candidate) {
  return (
    containsKoreanText(candidate.artist) ||
    containsKoreanText(candidate.appleMusicSearchTerm)
  );
}

function hasMismatch(candidate, context) {
  const candidateMoods = candidate.moodTags || [];
  const contextMoods = context.moodTags || [];

  return contextMoods.some((contextMood) => {
    const conflicts = MOOD_CONFLICTS[contextMood] || [];
    return candidateMoods.some((candidateMood) => conflicts.includes(candidateMood));
  });
}

function getExactDateTags(context) {
  return uniqueStrings([
    context.date.iso,
    context.date.monthDay,
    context.season,
    ...getContextEventIds(context),
    ...context.relatedDateTags
  ]);
}

function getContextEventIds(context) {
  return uniqueStrings([
    context.primaryEvent?.id,
    ...(context.exactEvents || []).map((event) => event.id),
    ...(context.seasonalEvents || []).map((event) => event.id),
    ...(context.nearbyEvents || []).map((event) => event.id)
  ]);
}

function getCandidateTags(candidate) {
  return uniqueStrings([
    ...(candidate.eventTags || []),
    ...(candidate.dateTags || []),
    ...(candidate.moodTags || [])
  ]);
}

function formatEventNames(eventIds, context) {
  const events = [
    ...(context.exactEvents || []),
    ...(context.seasonalEvents || []),
    ...(context.nearbyEvents || [])
  ];

  const names = eventIds.map((eventId) => {
    const event = events.find((item) => item.id === eventId);
    return event?.labels?.ko || eventId;
  });

  return formatList(names);
}

function formatList(values) {
  return values.filter(Boolean).join(", ");
}
