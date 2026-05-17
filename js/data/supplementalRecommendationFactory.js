const TRACK_LIBRARY = [
  ["Blueming", "IU", "ko-KR", ["bright", "spring", "fresh"]],
  ["Love wins all", "IU", "ko-KR", ["dramatic", "warm", "romantic"]],
  ["Palette", "IU", "ko-KR", ["reflective", "warm", "daily-life"]],
  ["Through the Night", "IU", "ko-KR", ["quiet", "night", "longing"]],
  ["Ditto", "NewJeans", "ko-KR", ["winter", "nostalgic", "youth"]],
  ["OMG", "NewJeans", "ko-KR", ["bright", "playful", "k-pop"]],
  ["Hype Boy", "NewJeans", "ko-KR", ["summer", "youth", "bright"]],
  ["Super Shy", "NewJeans", "ko-KR", ["summer", "playful", "bright"]],
  ["Dynamite", "BTS", "ko-KR", ["bright", "party", "global"]],
  ["Life Goes On", "BTS", "ko-KR", ["comfort", "reflective", "warm"]],
  ["Yet To Come", "BTS", "ko-KR", ["hopeful", "future", "warm"]],
  ["Butter", "BTS", "ko-KR", ["summer", "bright", "party"]],
  ["Euphoria", "Jung Kook", "ko-KR", ["bright", "hopeful", "youth"]],
  ["Standing Next to You", "Jung Kook", "ko-KR", ["global", "dance", "confident"]],
  ["Like Crazy", "Jimin", "ko-KR", ["night", "dreamy", "dance"]],
  ["Love Me Again", "V", "ko-KR", ["longing", "quiet", "warm"]],
  ["Wild Flower", "RM", "ko-KR", ["reflective", "resilient", "nature"]],
  ["Holo", "LeeHi", "ko-KR", ["comfort", "healing", "quiet"]],
  ["ONLY", "LeeHi", "ko-KR", ["romantic", "warm", "quiet"]],
  ["No One", "LeeHi", "ko-KR", ["bright", "urban", "dance"]],
  ["Square (2017)", "Yerin Baek", "ko-KR", ["dreamy", "night", "warm"]],
  ["Rest", "Yerin Baek", "ko-KR", ["quiet", "healing", "night"]],
  ["Antifreeze", "Yerin Baek", "ko-KR", ["winter", "warm", "indie"]],
  ["Square", "Yerin Baek", "ko-KR", ["dreamy", "indie", "night"]],
  ["Tomboy", "(G)I-DLE", "ko-KR", ["confident", "rock", "bright"]],
  ["Queencard", "(G)I-DLE", "ko-KR", ["playful", "party", "confident"]],
  ["I AM", "IVE", "ko-KR", ["hopeful", "bright", "confident"]],
  ["After LIKE", "IVE", "ko-KR", ["party", "bright", "dance"]],
  ["LOVE DIVE", "IVE", "ko-KR", ["dreamy", "confident", "night"]],
  ["Spicy", "aespa", "ko-KR", ["summer", "bright", "confident"]],
  ["Drama", "aespa", "ko-KR", ["dramatic", "confident", "night"]],
  ["Next Level", "aespa", "ko-KR", ["confident", "future", "dance"]],
  ["Psycho", "Red Velvet", "ko-KR", ["winter", "dramatic", "romantic"]],
  ["Feel My Rhythm", "Red Velvet", "ko-KR", ["spring", "elegant", "bright"]],
  ["Russian Roulette", "Red Velvet", "ko-KR", ["playful", "bright", "retro"]],
  ["Alcohol-Free", "TWICE", "ko-KR", ["summer", "bright", "vacation"]],
  ["Feel Special", "TWICE", "ko-KR", ["warm", "comfort", "bright"]],
  ["What is Love?", "TWICE", "ko-KR", ["playful", "romantic", "bright"]],
  ["FANCY", "TWICE", "ko-KR", ["bright", "dance", "romantic"]],
  ["Spring", "Park Bom", "ko-KR", ["spring", "longing", "hopeful"]],
  ["Good Day", "IU", "ko-KR", ["bright", "youth", "hopeful"]],
  ["You Were Beautiful", "DAY6", "ko-KR", ["nostalgic", "longing", "band"]],
  ["Welcome to the Show", "DAY6", "ko-KR", ["hopeful", "band", "bright"]],
  ["Zombie", "DAY6", "ko-KR", ["tired", "reflective", "comfort"]],
  ["Time of Our Life", "DAY6", "ko-KR", ["youth", "new-start", "bright"]],
  ["Love Poem", "IU", "ko-KR", ["comfort", "quiet", "warm"]],
  ["Traffic Light", "Lee Mujin", "ko-KR", ["youth", "daily-life", "bright"]],
  ["Episode", "Lee Mujin", "ko-KR", ["daily-life", "warm", "reflective"]],
  ["Aloha", "Jo Jung Suk", "ko-KR", ["warm", "romantic", "bright"]],
  ["I Like You", "Jo Jung Suk", "ko-KR", ["romantic", "warm", "daily-life"]],
  ["Every Day, Every Moment", "Paul Kim", "ko-KR", ["romantic", "warm", "gratitude"]],
  ["Me After You", "Paul Kim", "ko-KR", ["romantic", "warm", "sentimental"]],
  ["Can I Love Again", "4MEN", "ko-KR", ["longing", "ballad", "night"]],
  ["Drunken Confession", "Kim Min Seok", "ko-KR", ["winter", "romantic", "night"]],
  ["Love, Maybe", "MeloMance", "ko-KR", ["romantic", "bright", "warm"]],
  ["Gift", "MeloMance", "ko-KR", ["gift", "warm", "romantic"]],
  ["Event Horizon", "Younha", "ko-KR", ["hopeful", "dramatic", "future"]],
  ["Waiting", "Younha", "ko-KR", ["longing", "quiet", "night"]],
  ["Oort Cloud", "Younha", "ko-KR", ["travel", "hopeful", "bright"]],
  ["Love Lee", "AKMU", "ko-KR", ["playful", "bright", "romantic"]],
  ["How can I love the heartbreak", "AKMU", "ko-KR", ["breakup", "longing", "autumn"]],
  ["Dinosaur", "AKMU", "ko-KR", ["youth", "dreamy", "summer"]],
  ["200%", "AKMU", "ko-KR", ["spring", "playful", "bright"]],
  ["Don't Know What To Do", "BLACKPINK", "ko-KR", ["longing", "dance", "night"]],
  ["As If It's Your Last", "BLACKPINK", "ko-KR", ["summer", "party", "bright"]],
  ["Shut Down", "BLACKPINK", "ko-KR", ["confident", "night", "global"]],
  ["Flower", "JISOO", "ko-KR", ["spring", "elegant", "confident"]],
  ["You & Me", "JENNIE", "ko-KR", ["romantic", "night", "global"]],
  ["On The Ground", "ROSÉ", "ko-KR", ["reflective", "global", "hopeful"]],
  ["MONEY", "LISA", "ko-KR", ["confident", "party", "global"]],
  ["Get A Guitar", "RIIZE", "ko-KR", ["youth", "bright", "band"]],
  ["Love 119", "RIIZE", "ko-KR", ["winter", "romantic", "youth"]],
  ["Plot Twist", "TWS", "ko-KR", ["new-start", "school", "bright"]],
  ["Magnetic", "ILLIT", "ko-KR", ["playful", "bright", "crush"]],
  ["Perfect Night", "LE SSERAFIM", "ko-KR", ["night", "friendship", "bright"]],
  ["EASY", "LE SSERAFIM", "ko-KR", ["confident", "night", "dance"]],
  ["ANTIFRAGILE", "LE SSERAFIM", "ko-KR", ["resilient", "confident", "dance"]],
  ["Supernova", "aespa", "ko-KR", ["future", "confident", "bright"]],
  ["Girls Never Die", "tripleS", "ko-KR", ["youth", "resilient", "bright"]],
  ["I Don't Think That I Like Her", "Charlie Puth", "global", ["romantic", "bright", "global"]],
  ["Attention", "Charlie Puth", "global", ["urban", "night", "global"]],
  ["As It Was", "Harry Styles", "global", ["nostalgic", "bright", "global"]],
  ["Watermelon Sugar", "Harry Styles", "global", ["summer", "bright", "global"]],
  ["Late Night Talking", "Harry Styles", "global", ["night", "warm", "global"]],
  ["Anti-Hero", "Taylor Swift", "global", ["reflective", "autumn", "global"]],
  ["Cruel Summer", "Taylor Swift", "global", ["summer", "dramatic", "global"]],
  ["Lover", "Taylor Swift", "global", ["romantic", "warm", "global"]],
  ["cardigan", "Taylor Swift", "global", ["autumn", "nostalgic", "global"]],
  ["Snow On The Beach", "Taylor Swift", "global", ["winter", "dreamy", "global"]],
  ["Levitating", "Dua Lipa", "global", ["party", "bright", "global"]],
  ["Don't Start Now", "Dua Lipa", "global", ["dance", "confident", "global"]],
  ["Houdini", "Dua Lipa", "global", ["dance", "night", "global"]],
  ["Blinding Lights", "The Weeknd", "global", ["night", "drive", "global"]],
  ["Save Your Tears", "The Weeknd", "global", ["night", "nostalgic", "global"]],
  ["Die For You", "The Weeknd", "global", ["romantic", "night", "global"]],
  ["Bad Habit", "Steve Lacy", "global", ["summer", "groove", "global"]],
  ["Good Days", "SZA", "global", ["hopeful", "dreamy", "global"]],
  ["Kill Bill", "SZA", "global", ["night", "dramatic", "global"]],
  ["Snooze", "SZA", "global", ["romantic", "warm", "global"]],
  ["Flowers", "Miley Cyrus", "global", ["self-love", "bright", "global"]],
  ["Easy On Me", "Adele", "global", ["reflective", "ballad", "global"]],
  ["Someone Like You", "Adele", "global", ["longing", "autumn", "global"]],
  ["Hello", "Adele", "global", ["longing", "dramatic", "global"]],
  ["Heat Waves", "Glass Animals", "global", ["summer", "dreamy", "global"]],
  ["Sunflower", "Post Malone & Swae Lee", "global", ["bright", "warm", "global"]],
  ["Circles", "Post Malone", "global", ["reflective", "night", "global"]],
  ["Good 4 U", "Olivia Rodrigo", "global", ["angry", "youth", "global"]],
  ["drivers license", "Olivia Rodrigo", "global", ["breakup", "night", "global"]],
  ["vampire", "Olivia Rodrigo", "global", ["dramatic", "night", "global"]],
  ["deja vu", "Olivia Rodrigo", "global", ["nostalgic", "youth", "global"]],
  ["Here Comes The Sun", "The Beatles", "global", ["spring", "hopeful", "global"]],
  ["Let It Be", "The Beatles", "global", ["comfort", "classic", "global"]],
  ["Come Together", "The Beatles", "global", ["classic", "groove", "global"]],
  ["Bridge Over Troubled Water", "Simon & Garfunkel", "global", ["comfort", "classic", "global"]],
  ["The Sound of Silence", "Simon & Garfunkel", "global", ["quiet", "reflective", "global"]],
  ["September", "Earth, Wind & Fire", "global", ["autumn", "party", "global"]],
  ["Boogie Wonderland", "Earth, Wind & Fire", "global", ["party", "bright", "global"]],
  ["Dancing Queen", "ABBA", "global", ["party", "bright", "classic"]],
  ["Happy New Year", "ABBA", "global", ["new-start", "year-end", "global"]],
  ["Take On Me", "a-ha", "global", ["bright", "retro", "global"]],
  ["Everybody Wants To Rule The World", "Tears for Fears", "global", ["reflective", "retro", "global"]],
  ["Africa", "TOTO", "global", ["travel", "classic", "global"]],
  ["Sweet Child O' Mine", "Guns N' Roses", "global", ["classic", "rock", "global"]],
  ["November Rain", "Guns N' Roses", "global", ["autumn", "rain", "dramatic"]],
  ["Fix You", "Coldplay", "global", ["comfort", "hopeful", "global"]],
  ["Yellow", "Coldplay", "global", ["warm", "romantic", "global"]],
  ["Viva La Vida", "Coldplay", "global", ["anthemic", "global", "bright"]],
  ["A Sky Full of Stars", "Coldplay", "global", ["night", "hopeful", "global"]],
  ["Something Just Like This", "The Chainsmokers & Coldplay", "global", ["bright", "global", "hopeful"]],
  ["I'm Yours", "Jason Mraz", "global", ["summer", "warm", "global"]],
  ["Lucky", "Jason Mraz & Colbie Caillat", "global", ["romantic", "warm", "global"]],
  ["Sunday Morning", "Maroon 5", "global", ["weekend", "warm", "global"]],
  ["Sugar", "Maroon 5", "global", ["romantic", "bright", "global"]],
  ["Memories", "Maroon 5", "global", ["nostalgic", "year-end", "global"]],
  ["Counting Stars", "OneRepublic", "global", ["hopeful", "night", "global"]],
  ["I Ain't Worried", "OneRepublic", "global", ["summer", "bright", "global"]],
  ["Shivers", "Ed Sheeran", "global", ["romantic", "bright", "global"]],
  ["Perfect", "Ed Sheeran", "global", ["romantic", "warm", "global"]],
  ["Photograph", "Ed Sheeran", "global", ["memory", "nostalgic", "global"]],
  ["Shape of You", "Ed Sheeran", "global", ["dance", "global", "bright"]],
  ["Stay", "The Kid LAROI & Justin Bieber", "global", ["youth", "bright", "global"]],
  ["Peaches", "Justin Bieber", "global", ["summer", "warm", "global"]],
  ["Ghost", "Justin Bieber", "global", ["longing", "comfort", "global"]],
  ["STAY", "BLACKPINK", "ko-KR", ["quiet", "longing", "k-pop"]],
  ["Beautiful", "Crush", "ko-KR", ["romantic", "warm", "k-drama"]],
  ["Sofa", "Crush", "ko-KR", ["longing", "night", "urban"]],
  ["Sometimes", "Crush", "ko-KR", ["spring", "warm", "urban"]],
  ["Any Song", "ZICO", "ko-KR", ["party", "playful", "bright"]],
  ["New thing", "ZICO", "ko-KR", ["dance", "confident", "urban"]],
  ["Rover", "KAI", "ko-KR", ["dance", "confident", "night"]],
  ["Growl", "EXO", "ko-KR", ["confident", "dance", "k-pop"]],
  ["Ko Ko Bop", "EXO", "ko-KR", ["summer", "party", "k-pop"]],
  ["Candy", "NCT DREAM", "ko-KR", ["winter", "bright", "sweet"]],
  ["Hello Future", "NCT DREAM", "ko-KR", ["future", "hopeful", "bright"]],
  ["Kick It", "NCT 127", "ko-KR", ["confident", "dance", "night"]],
  ["Superhuman", "NCT 127", "ko-KR", ["future", "bright", "dance"]],
  ["God of Music", "SEVENTEEN", "ko-KR", ["bright", "festival", "k-pop"]],
  ["Super", "SEVENTEEN", "ko-KR", ["confident", "dance", "k-pop"]],
  ["Very Nice", "SEVENTEEN", "ko-KR", ["bright", "party", "k-pop"]],
  ["Pretty U", "SEVENTEEN", "ko-KR", ["spring", "romantic", "bright"]],
  ["Left & Right", "SEVENTEEN", "ko-KR", ["bright", "youth", "dance"]],
  ["Fighting", "BSS", "ko-KR", ["encouragement", "weekday", "bright"]],
  ["Horangsuwolga", "Tophyun", "ko-KR", ["traditional", "dramatic", "night"]],
  ["Dream", "Suzy & Baekhyun", "ko-KR", ["romantic", "dreamy", "warm"]],
  ["Perhaps Love", "HowL & J", "ko-KR", ["romantic", "k-drama", "warm"]],
  ["Love Rain", "Kim Tae Woo", "ko-KR", ["rain", "romantic", "nostalgic"]],
  ["Rain", "TAEYEON", "ko-KR", ["rain", "quiet", "longing"]],
  ["Fine", "TAEYEON", "ko-KR", ["breakup", "reflective", "winter"]],
  ["INVU", "TAEYEON", "ko-KR", ["night", "dramatic", "confident"]],
  ["Weekend", "TAEYEON", "ko-KR", ["weekend", "bright", "playful"]],
  ["I", "TAEYEON", "ko-KR", ["self-love", "hopeful", "bright"]],
  ["Lilac", "IU", "ko-KR", ["spring", "farewell", "bright"]],
  ["Eight", "IU & SUGA", "ko-KR", ["nostalgic", "youth", "bright"]],
  ["Celebrity", "IU", "ko-KR", ["comfort", "bright", "self-love"]],
  ["Strawberry Moon", "IU", "ko-KR", ["moon", "romantic", "night"]]
];

const MONTH_CONTEXTS = [
  { month: 1, season: "winter", tags: ["january", "deep-winter"], moods: ["winter", "new-start", "quiet"] },
  { month: 2, season: "winter", tags: ["february", "graduation"], moods: ["farewell", "school", "winter"] },
  { month: 3, season: "spring", tags: ["march", "new-semester"], moods: ["new-start", "spring", "youth"] },
  { month: 4, season: "spring", tags: ["april", "cherry-blossom"], moods: ["spring", "walking", "romantic"] },
  { month: 5, season: "spring", tags: ["may", "family"], moods: ["family", "warm", "spring"] },
  { month: 6, season: "summer", tags: ["june", "early-summer"], moods: ["summer", "rain", "humid"] },
  { month: 7, season: "summer", tags: ["july", "rainy-summer"], moods: ["summer", "rain", "travel"] },
  { month: 8, season: "summer", tags: ["august", "vacation"], moods: ["summer", "vacation", "bright"] },
  { month: 9, season: "autumn", tags: ["september", "early-autumn"], moods: ["autumn", "memory", "bright"] },
  { month: 10, season: "autumn", tags: ["october", "deep-autumn"], moods: ["autumn", "walking", "literary"] },
  { month: 11, season: "autumn", tags: ["november", "late-autumn"], moods: ["autumn", "exam", "comfort"] },
  { month: 12, season: "winter", tags: ["december", "year-end"], moods: ["winter", "year-end", "holiday"] }
];

const MONTH_PHASES = ["month-opening", "early-month", "steady-month", "mid-month", "late-month", "month-closing"];
const WEEKDAY_TAGS = ["weekday-sunday", "weekday-monday", "weekday-tuesday", "weekday-wednesday", "weekday-thursday", "weekday-friday", "weekday-saturday"];
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAY_TEXTURES = [
  { tag: "quiet-morning", moods: ["quiet", "warm", "daily-life"] },
  { tag: "commute-bright", moods: ["bright", "urban", "weekday"] },
  { tag: "late-night", moods: ["night", "longing", "dreamy"] },
  { tag: "nostalgia-lane", moods: ["nostalgic", "memory", "reflective"] },
  { tag: "comfort-lane", moods: ["comfort", "healing", "warm"] },
  { tag: "romance-lane", moods: ["romantic", "sweet", "warm"] },
  { tag: "festival-lane", moods: ["party", "bright", "festival"] },
  { tag: "indie-lane", moods: ["indie", "quiet", "walking"] },
  { tag: "city-walk", moods: ["urban", "walking", "night"] },
  { tag: "fresh-start", moods: ["new-start", "hopeful", "bright"] },
  { tag: "rain-window", moods: ["rain", "indoors", "melancholy"] },
  { tag: "family-table", moods: ["family", "gratitude", "warm"] }
];
const TEMPO_LANES = ["slow-burn", "mid-tempo", "upbeat", "ballad", "band", "dance"];
const MONTH_SIGNAL_GROUPS = [
  { month: 1, terms: ["january", "jan"] },
  { month: 2, terms: ["february", "feb"] },
  { month: 3, terms: ["march", "mar"] },
  { month: 4, terms: ["april", "apr"] },
  { month: 5, terms: ["may"] },
  { month: 6, terms: ["june", "jun"] },
  { month: 7, terms: ["july", "jul"] },
  { month: 8, terms: ["august", "aug"] },
  { month: 9, terms: ["september", "sep"] },
  { month: 10, terms: ["october", "oct"] },
  { month: 11, terms: ["november", "nov"] },
  { month: 12, terms: ["december", "dec", "christmas"] }
];

export function buildSupplementalRecommendations(count = 435) {
  const usage = new Map();

  return Array.from({ length: count }, (_, index) => {
    const calendar = getCalendarPosition((index % 365) + 1);
    const cycle = Math.floor(index / 365);
    const context = MONTH_CONTEXTS[calendar.month - 1];
    const phase = getMonthPhase(calendar.day, calendar.monthLength);
    const texture = getDayTexture(calendar, cycle);
    const tempoLane = TEMPO_LANES[(calendar.day + cycle) % TEMPO_LANES.length];
    const track = selectTrack(context, phase, texture, tempoLane, index, usage);
    const trackKey = getTrackKey(track);
    const weekday = WEEKDAY_TAGS[index % WEEKDAY_TAGS.length];
    const rotation = `rotation-${String(calendar.dayOfYear).padStart(3, "0")}`;
    const sequence = String(index + 1).padStart(3, "0");
    const [title, artist, locale, trackMoods] = track;
    const monthTag = `month-${String(context.month).padStart(2, "0")}`;
    const isKorean = locale === "ko-KR";

    usage.set(trackKey, (usage.get(trackKey) || 0) + 1);

    return {
      id: `supplemental-${sequence}-${slugify(title)}-${slugify(artist)}`,
      title,
      artist,
      appleMusicSearchTerm: `${artist} ${title}`,
      eventTags: [],
      dateTags: uniqueStrings([
        rotation,
        monthTag,
        phase,
        weekday,
        texture.tag,
        tempoLane,
        `day-${String(calendar.day).padStart(2, "0")}`,
        `month-week-${Math.ceil(calendar.day / 7)}`,
        `rotation-cycle-${cycle + 1}`,
        context.season,
        ...context.tags
      ]),
      moodTags: uniqueStrings([
        ...trackMoods,
        ...context.moods,
        ...texture.moods,
        phase,
        tempoLane,
        locale === "global" ? "global" : "k-pop"
      ]),
      locale,
      lyricHint: `${context.tags[0]}의 ${phase} 날짜에 맞춰, ${texture.tag.replaceAll("-", " ")} 감정과 ${trackMoods.slice(0, 2).join(", ")} 분위기가 겹치도록 배치한 곡.`,
      notes: `Supplemental catalog item ${sequence}; used for daily variation when no stronger exact-date or cultural event song is available.`,
      priority: (isKorean ? 58 : 52) + (index % 12)
    };
  });
}

function getCalendarPosition(dayOfYear) {
  let cursor = dayOfYear;

  for (let index = 0; index < MONTH_LENGTHS.length; index += 1) {
    const monthLength = MONTH_LENGTHS[index];
    if (cursor <= monthLength) {
      return {
        dayOfYear,
        month: index + 1,
        day: cursor,
        monthLength
      };
    }

    cursor -= monthLength;
  }

  return {
    dayOfYear: 365,
    month: 12,
    day: 31,
    monthLength: 31
  };
}

function getMonthPhase(day, monthLength) {
  if (day === 1) return "month-opening";
  if (day <= 7) return "early-month";
  if (day >= monthLength - 2) return "month-closing";
  if (day >= 22) return "late-month";
  if (day >= 14 && day <= 17) return "mid-month";
  return "steady-month";
}

function selectTrack(context, phase, texture, tempoLane, index, usage) {
  const scored = TRACK_LIBRARY.map((track, trackIndex) => {
    const moods = track[3];
    const monthSignals = getTrackMonthSignals(track);
    const monthSignalMismatch =
      monthSignals.length > 0 && !monthSignals.includes(context.month);
    const score =
      countOverlap(moods, context.moods) * 4 +
      countOverlap(moods, context.tags) * 3 +
      countOverlap(moods, texture.moods) * 5 +
      (moods.includes(context.season) ? 2 : 0) +
      (moods.includes(phase) ? 2 : 0) +
      (moods.includes(tempoLane) ? 2 : 0) +
      (monthSignals.includes(context.month) ? 12 : 0) -
      (usage.get(getTrackKey(track)) || 0) * 10 -
      (monthSignalMismatch ? 80 : 0);

    return { track, trackIndex, score };
  }).filter((entry) => entry.score > -40);

  const pool = scored.length > 0 ? scored : TRACK_LIBRARY.map((track, trackIndex) => ({ track, trackIndex, score: 0 }));
  pool.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.trackIndex - b.trackIndex;
  });

  return pool[index % pool.length].track;
}

function getDayTexture(calendar, cycle) {
  return DAY_TEXTURES[(calendar.day + calendar.month * 2 + cycle * 3) % DAY_TEXTURES.length];
}

function getTrackMonthSignals(track) {
  const text = normalizeForReference([track[0], track[1], ...(track[3] || [])].join(" "));

  return MONTH_SIGNAL_GROUPS
    .filter((group) => group.terms.some((term) => containsReferenceTerm(text, term)))
    .map((group) => group.month);
}

function getTrackKey(track) {
  return `${track[0]}::${track[1]}`.toLowerCase();
}

function countOverlap(first, second) {
  const secondSet = new Set(second);
  return first.reduce((count, value) => count + (secondSet.has(value) ? 1 : 0), 0);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function containsReferenceTerm(haystack, term) {
  const normalizedHaystack = normalizeForReference(haystack);
  const normalizedTerm = normalizeForReference(term);
  if (!normalizedTerm) return false;

  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`).test(normalizedHaystack);
}

function normalizeForReference(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
