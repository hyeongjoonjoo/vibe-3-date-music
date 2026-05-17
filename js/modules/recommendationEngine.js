import {
  containsKoreanText,
  countIntersections,
  normalizeText,
  uniqueStrings
} from "./dateUtils.js";
import { getSeedRecommendationsData } from "./localDataRegistry.js";

const SCORE_WEIGHTS = {
  exactDateTextMatch: 165,
  lyricDateTextMatch: 165,
  monthTextMatch: 45,
  exactDateMatch: 82,
  exactEventMatch: 115,
  dateFamousBoost: 64,
  rotationMatch: 92,
  labelTagMatch: 24,
  eventKeywordMatch: 30,
  titleMatch: 26,
  lyricHintOrManualTagMatch: 18,
  moodSeasonMatch: 6,
  koreanLanguageBoost: 8,
  koreanArtistBoost: 6,
  dailyVarietyBoost: 12,
  mismatchPenalty: -15,
  monthMismatchPenalty: -120
};

const CONTEXT_CACHE = new WeakMap();
const CANDIDATE_CACHE = new WeakMap();

const MONTH_REFERENCE_GROUPS = [
  { month: 1, terms: ["january", "jan", "1월", "month-01"] },
  { month: 2, terms: ["february", "feb", "2월", "month-02"] },
  { month: 3, terms: ["march", "mar", "3월", "month-03"] },
  { month: 4, terms: ["april", "apr", "4월", "month-04"] },
  { month: 5, terms: ["may", "5월", "month-05"] },
  { month: 6, terms: ["june", "jun", "6월", "month-06"] },
  { month: 7, terms: ["july", "jul", "7월", "month-07"] },
  { month: 8, terms: ["august", "aug", "8월", "month-08"] },
  { month: 9, terms: ["september", "sep", "9월", "month-09"] },
  { month: 10, terms: ["october", "oct", "10월", "month-10"] },
  { month: 11, terms: ["november", "nov", "11월", "month-11"] },
  { month: 12, terms: ["december", "dec", "12월", "month-12"] }
];

const MONTH_NAMES = MONTH_REFERENCE_GROUPS.map((group) => group.terms[0]);
const SHORT_MONTH_NAMES = MONTH_REFERENCE_GROUPS.map((group) => {
  return group.terms.find((term) => /^[a-z]{3}$/.test(term)) || group.terms[0];
});

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

  const bestByTrack = new Map();

  list
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
    .forEach((candidate) => {
      const key = getTrackIdentityKey(candidate);
      const current = bestByTrack.get(key);

      if (!current || candidate.score > current.score || (
        candidate.score === current.score && (candidate.priority || 0) > (current.priority || 0)
      )) {
        bestByTrack.set(key, candidate);
      }
    });

  const scoreSorted = [...bestByTrack.values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.priority || 0) - (a.priority || 0);
    });

  return diversifyByArtist(scoreSorted);
}

export function buildRecommendationReasons(candidate, context) {
  const reasons = [];
  const exactTags = getExactDateTags(context);
  const candidateTags = getCandidateTags(candidate);
  const eventIds = getActiveEventIds(context);
  const candidateEventMatches = (candidate.eventTags || []).filter((tag) => eventIds.includes(tag));
  const dateMatches = (candidate.dateTags || []).filter((tag) => exactTags.includes(tag));
  const moodMatches = (candidate.moodTags || []).filter((tag) => context.moodTags.includes(tag));

  if (hasDirectDateTextMatch(candidate, context)) {
    reasons.push("Title or lyric excerpt directly references the selected date.");
  }

  if (hasMonthMismatch(candidate, context)) {
    reasons.push("A different month is explicitly referenced, so this track is heavily deprioritized.");
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
  const directDateTextMatch = getDirectDateTextMatchScore(candidate, context);
  const lyricDateTextMatch = getLyricDateTextMatchScore(candidate, context);
  const exactDateMatch = hasExactDateMatch(candidate, context)
    ? SCORE_WEIGHTS.exactDateMatch
    : 0;
  const exactEventMatch = hasExactEventMatch(candidate, context)
    ? SCORE_WEIGHTS.exactEventMatch
    : 0;
  const dateFamousBoost = getDateFamousBoost(candidate, context);
  const rotationMatch = getRotationMatchScore(candidate, context);
  const labelTagMatch = getLabelTagMatchScore(candidate, context);
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
  const monthMismatchPenalty = hasMonthMismatch(candidate, context)
    ? SCORE_WEIGHTS.monthMismatchPenalty
    : 0;
  const dailyVarietyBoost = getDailyVarietyBoost(candidate, context);

  return {
    directDateTextMatch,
    lyricDateTextMatch,
    exactDateMatch,
    exactEventMatch,
    dateFamousBoost,
    rotationMatch,
    labelTagMatch,
    eventKeywordMatch,
    titleMatch,
    lyricHintOrManualTagMatch,
    moodSeasonMatch,
    koreanLanguageBoost,
    koreanArtistBoost,
    dailyVarietyBoost,
    mismatchPenalty,
    monthMismatchPenalty
  };
}

function getRotationMatchScore(candidate, context) {
  if (context.hasExactEvent && !hasExactDateMatch(candidate, context) && !hasExactEventMatch(candidate, context)) {
    return 0;
  }

  if (hasMonthMismatch(candidate, context)) {
    return 0;
  }

  const rotationTag = (context.dateLabels?.tags || []).find((tag) => tag.startsWith("rotation-"));
  const contextualTags = new Set(candidate.dateTags || []);
  const hasContextualFit =
    contextualTags.has(context.dateLabels?.monthLabel) ||
    countIntersections(candidate.moodTags || [], context.moodTags || []) > 0;

  return rotationTag && contextualTags.has(rotationTag) && hasContextualFit
    ? SCORE_WEIGHTS.rotationMatch
    : 0;
}

function getDateFamousBoost(candidate, context) {
  const tags = getCandidateTags(candidate);
  const hasKnownDateSignal =
    tags.includes("date-famous") ||
    tags.includes("internet-date-pick") ||
    tags.includes("lyric-date-reference");

  if (!hasKnownDateSignal) return 0;

  const exactFit =
    hasExactDateMatch(candidate, context) ||
    hasExactEventMatch(candidate, context) ||
    hasExactDayTextReference(candidate, context) ||
    hasExactLyricDateReference(candidate, context);

  return exactFit ? SCORE_WEIGHTS.dateFamousBoost : 0;
}

function hasExactEventMatch(candidate, context) {
  const exactEventIds = getExactEventIds(context);
  return (candidate.eventTags || []).some((tag) => exactEventIds.includes(tag));
}

function getLabelTagMatchScore(candidate, context) {
  const labels = (context.dateLabels?.tags || []).filter((tag) => tag !== "date-code-title");
  const candidateTags = getCandidateTags(candidate);
  const matches = countIntersections(candidateTags, labels);

  return Math.min(matches, 3) * SCORE_WEIGHTS.labelTagMatch;
}

function hasDirectDateTextMatch(candidate, context) {
  return getDirectDateTextMatchScore(candidate, context) > 0 ||
    getLyricDateTextMatchScore(candidate, context) > 0;
}

function getDirectDateTextMatchScore(candidate, context) {
  if (hasExactTitleDateReference(candidate, context)) {
    return SCORE_WEIGHTS.exactDateTextMatch;
  }

  const haystack = getCandidateCache(candidate).titleSearchText;

  const monthMatch = buildMonthReferenceTerms(context).some((term) => {
    return containsNormalizedReferenceTerm(haystack, term);
  });

  return monthMatch ? SCORE_WEIGHTS.monthTextMatch : 0;
}

function hasExactDayTextReference(candidate, context) {
  return hasExactTitleDateReference(candidate, context) ||
    hasExactLyricDateReference(candidate, context);
}

function hasExactTitleDateReference(candidate, context) {
  const haystack = getCandidateCache(candidate).titleSearchText;

  return buildExactDayReferenceTerms(context).some((term) => {
    return containsNormalizedReferenceTerm(haystack, term);
  });
}

function getLyricDateTextMatchScore(candidate, context) {
  if (hasExactLyricDateReference(candidate, context)) {
    return SCORE_WEIGHTS.lyricDateTextMatch;
  }

  const haystack = getCandidateCache(candidate).lyricDateExcerptText;
  if (!haystack) return 0;

  const monthMatch = buildMonthReferenceTerms(context).some((term) => {
    return containsNormalizedReferenceTerm(haystack, term);
  });

  return monthMatch ? SCORE_WEIGHTS.monthTextMatch : 0;
}

function hasExactLyricDateReference(candidate, context) {
  const haystack = getCandidateCache(candidate).lyricDateExcerptText;
  if (!haystack) return false;

  return buildLyricDateReferenceTerms(context).some((term) => {
    return containsNormalizedReferenceTerm(haystack, term);
  });
}

function buildLyricDateReferenceTerms(context) {
  return getCachedContextValue(context, "lyricDateReferenceTerms", () => uniqueStrings([
    ...buildExactDayReferenceTerms(context),
    ...(context.exactEvents || []).flatMap((event) => {
      return [
        event.labels?.ko,
        event.labels?.en,
        ...(event.searchKeywords || [])
      ];
    })
  ]).filter((term) => String(term).length > 1));
}

function getDailyVarietyBoost(candidate, context) {
  const seed = `${context.date.iso}:${candidate.id}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 997;
  }

  return hash % (SCORE_WEIGHTS.dailyVarietyBoost + 1);
}

function hasExactDateMatch(candidate, context) {
  const exactTags = getExactDateTags(context);
  return (candidate.dateTags || []).some((tag) => exactTags.includes(tag));
}

function hasEventKeywordMatch(candidate, context) {
  const eventIds = getActiveEventIds(context);
  const eventTagMatch = (candidate.eventTags || []).some((tag) => eventIds.includes(tag));
  if (eventTagMatch) return true;

  const haystack = getCandidateCache(candidate).keywordText;

  return context.searchKeywords.some((keyword) => haystack.includes(normalizeText(keyword)));
}

function findTitleKeyword(candidate, context) {
  const title = getCandidateCache(candidate).titleText;
  const titleKeywords = uniqueStrings([
    ...buildDateReferenceTerms(context),
    ...context.searchKeywords,
    context.primaryEvent?.labels?.ko,
    context.primaryEvent?.labels?.en,
    context.season
  ]);

  return titleKeywords.find((keyword) => {
    return containsReferenceTerm(title, keyword);
  });
}

function buildDateReferenceTerms(context) {
  return getCachedContextValue(context, "dateReferenceTerms", () => uniqueStrings([
    ...buildExactDayReferenceTerms(context),
    ...buildMonthReferenceTerms(context)
  ]));
}

function buildExactDayReferenceTerms(context) {
  return getCachedContextValue(context, "exactDayReferenceTerms", () => {
    const month = context.date.month;
    const day = context.date.day;
    const monthName = MONTH_NAMES[month - 1];
    const shortMonthName = SHORT_MONTH_NAMES[month - 1];
    const ordinal = getOrdinal(day);
    const ordinalDayName = getOrdinalDayName(day);
    const paddedMonth = String(month).padStart(2, "0");
    const paddedDay = String(day).padStart(2, "0");

    return uniqueStrings([
      context.date.iso,
      context.date.monthDay,
      `${paddedMonth}${paddedDay}`,
      `${month}${paddedDay}`,
      `${month}-${day}`,
      `${month}.${day}`,
      `${month}/${day}`,
      `${month}월 ${day}일`,
      `${month}월${day}일`,
      `${monthName} ${day}`,
      `${monthName} ${ordinal}`,
      `${shortMonthName} ${day}`,
      `${day} ${monthName}`,
      `${day} ${shortMonthName}`,
      `${ordinalDayName} of ${monthName}`,
      `${ordinal} of ${monthName}`,
      `${ordinal} night of ${monthName}`,
      `${ordinalDayName} night of ${monthName}`,
      `${monthName} ${ordinalDayName}`
    ]);
  });
}

function buildMonthReferenceTerms(context) {
  return getCachedContextValue(context, "monthReferenceTerms", () => {
    const month = context.date.month;

    return uniqueStrings([
      MONTH_NAMES[month - 1],
      SHORT_MONTH_NAMES[month - 1],
      `${month}월`,
      `month-${String(month).padStart(2, "0")}`
    ]);
  });
}

function containsReferenceTerm(haystack, term) {
  return containsNormalizedReferenceTerm(normalizeForReference(haystack), term);
}

function containsNormalizedReferenceTerm(normalizedHaystack, term) {
  const normalizedTerm = normalizeForReference(term);
  if (!normalizedTerm) return false;

  const safeTerm = escapeRegExp(normalizedTerm);

  if (/^\d+$/.test(normalizedTerm)) {
    return new RegExp(`(^|[^0-9])${safeTerm}([^0-9]|$)`).test(normalizedHaystack);
  }

  if (/^[a-z0-9 ]+$/.test(normalizedTerm)) {
    return new RegExp(`(^|[^a-z0-9])${safeTerm}([^a-z0-9]|$)`).test(normalizedHaystack);
  }

  return normalizedHaystack.includes(normalizedTerm);
}

function normalizeForReference(value) {
  return normalizeText(value).replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]+/g, " ");
}

function getCachedContextValue(context, key, producer) {
  let cache = CONTEXT_CACHE.get(context);

  if (!cache) {
    cache = {};
    CONTEXT_CACHE.set(context, cache);
  }

  if (!(key in cache)) {
    cache[key] = producer();
  }

  return cache[key];
}

function getCandidateCache(candidate) {
  let cache = CANDIDATE_CACHE.get(candidate);
  if (cache) return cache;

  cache = {
    titleText: normalizeText(candidate.title || ""),
    titleSearchText: normalizeForReference(`${candidate.title || ""} ${candidate.appleMusicSearchTerm || ""}`),
    lyricDateExcerptText: normalizeForReference(candidate.lyricDateExcerpt || ""),
    keywordText: normalizeText([
      candidate.appleMusicSearchTerm,
      candidate.title,
      candidate.artist,
      candidate.notes
    ].join(" ")),
    lyricNotesText: normalizeText(`${candidate.lyricHint || ""} ${candidate.notes || ""}`),
    monthReferenceText: normalizeForReference([
      candidate.title,
      candidate.lyricHint,
      candidate.notes,
      candidate.appleMusicSearchTerm,
      ...(candidate.dateTags || []),
      ...(candidate.moodTags || [])
    ].join(" ")),
    tags: uniqueStrings([
      ...(candidate.eventTags || []),
      ...(candidate.dateTags || []),
      ...(candidate.moodTags || [])
    ]),
    trackIdentityKey: normalizeForReference(`${candidate.title || ""} ${candidate.artist || ""}`)
  };

  CANDIDATE_CACHE.set(candidate, cache);
  return cache;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    ...(context.dateLabels?.tags || []),
    ...getActiveEventIds(context)
  ]);
  const manualTagMatch = countIntersections(candidateTags, contextTags) > 0;
  if (manualTagMatch) return true;

  const lyricAndNotes = getCandidateCache(candidate).lyricNotesText;
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

function hasMonthMismatch(candidate, context) {
  if (hasExactDateMatch(candidate, context) || hasExactEventMatch(candidate, context)) {
    return false;
  }

  const referencedMonths = getCandidateMonthReferences(candidate);
  return referencedMonths.length > 0 && !referencedMonths.includes(context.date.month);
}

function getCandidateMonthReferences(candidate) {
  const cache = getCandidateCache(candidate);

  return MONTH_REFERENCE_GROUPS
    .filter((group) => {
      return group.terms.some((term) => containsNormalizedReferenceTerm(cache.monthReferenceText, term));
    })
    .map((group) => group.month);
}

function getExactDateTags(context) {
  return getCachedContextValue(context, "exactDateTags", () => {
    const exactLabelTags = (context.dateLabels?.tags || []).filter((tag) => {
      return (
        tag === context.dateLabels?.dateCode ||
        tag === context.dateLabels?.looseDateCode ||
        (tag.startsWith("date-code-") && tag !== "date-code-title")
      );
    });

    return uniqueStrings([
      context.date.iso,
      context.date.monthDay,
      ...exactLabelTags,
      ...getExactEventIds(context)
    ]);
  });
}

function getOrdinalDayName(day) {
  return [
    "",
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
    "eleventh",
    "twelfth",
    "thirteenth",
    "fourteenth",
    "fifteenth",
    "sixteenth",
    "seventeenth",
    "eighteenth",
    "nineteenth",
    "twentieth",
    "twenty first",
    "twenty second",
    "twenty third",
    "twenty fourth",
    "twenty fifth",
    "twenty sixth",
    "twenty seventh",
    "twenty eighth",
    "twenty ninth",
    "thirtieth",
    "thirty first"
  ][day] || String(day);
}

function getContextEventIds(context) {
  return uniqueStrings([
    context.primaryEvent?.id,
    ...(context.exactEvents || []).map((event) => event.id),
    ...(context.seasonalEvents || []).map((event) => event.id),
    ...(context.nearbyEvents || []).map((event) => event.id)
  ]);
}

function getActiveEventIds(context) {
  return getCachedContextValue(context, "activeEventIds", () => uniqueStrings([
    context.primaryEvent?.id,
    ...(context.exactEvents || []).map((event) => event.id),
    ...(context.seasonalEvents || []).map((event) => event.id)
  ]));
}

function getExactEventIds(context) {
  return getCachedContextValue(context, "exactEventIds", () => {
    return uniqueStrings((context.exactEvents || []).map((event) => event.id));
  });
}

function getCandidateTags(candidate) {
  return getCandidateCache(candidate).tags;
}

function getTrackIdentityKey(candidate) {
  return getCandidateCache(candidate).trackIdentityKey;
}

function diversifyByArtist(candidates) {
  const usedArtists = new Set();
  const primaryPass = [];
  const overflow = [];

  candidates.forEach((candidate) => {
    const artistKey = normalizeForReference(candidate.artist || "");
    const hasExactSignal =
      (candidate.scoreBreakdown?.exactDateMatch || 0) > 0 ||
      (candidate.scoreBreakdown?.exactEventMatch || 0) > 0 ||
      (candidate.scoreBreakdown?.directDateTextMatch || 0) >= SCORE_WEIGHTS.exactDateTextMatch ||
      (candidate.scoreBreakdown?.lyricDateTextMatch || 0) >= SCORE_WEIGHTS.lyricDateTextMatch;

    if (hasExactSignal || !usedArtists.has(artistKey)) {
      primaryPass.push(candidate);
      if (artistKey) usedArtists.add(artistKey);
      return;
    }

    overflow.push(candidate);
  });

  return [...primaryPass, ...overflow];
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
