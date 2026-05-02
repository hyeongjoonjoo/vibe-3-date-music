import { configureLocalData } from "../modules/localDataRegistry.js";
import { getEventContextFromDate } from "../modules/dateContext.js";
import {
  buildSearchTerms,
  rankRecommendations
} from "../modules/recommendationEngine.js";

// Sample usage only. In the real app, load these objects from:
// - data/events-ko.json
// - data/seed-recommendations.json
configureLocalData({
  events: window.EVENTS_KO_JSON,
  recommendations: window.SEED_RECOMMENDATIONS_JSON
});

const context = getEventContextFromDate("2026-10-09");
const searchTerms = buildSearchTerms(context);
const ranked = rankRecommendations(window.SEED_RECOMMENDATIONS_JSON.songs, context);

console.log(context.primaryEvent.labels.ko);
console.log(searchTerms.slice(0, 8));
console.log(ranked.slice(0, 5));

// Expected behavior notes:
// - 2026-10-09 should identify 한글날 as the primary exact event.
// - Search terms should include 한글날, 한글, 우리말, autumn, and related mood tags.
// - Songs tagged with hangeul-day, autumn, literary, or Korean lyric-forward notes should rank high.
// - Each ranked item includes score, scoreBreakdown, and human-readable reasons for later UI display.
//
// Additional useful test dates:
// - 2026-02-17: 설날 main date, should emphasize family, tradition, winter, homecoming.
// - 2026-09-25: 추석 main date, should emphasize family, harvest, autumn, full-moon mood.
// - 2026-04-05: 식목일 plus 벚꽃 시즌 overlap, should favor spring and walking songs.
// - 2026-07-05: 장마철, should favor rain and melancholy songs.
// - 2026-11-19: 수능 시즌, should favor comfort and encouragement songs.
