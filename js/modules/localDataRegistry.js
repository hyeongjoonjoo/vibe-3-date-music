let eventsData = null;
let seedRecommendationsData = null;

export function configureLocalData({ events, recommendations } = {}) {
  if (events) {
    eventsData = events;
  }

  if (recommendations) {
    seedRecommendationsData = recommendations;
  }
}

export function getEventsData() {
  if (!eventsData) {
    throw new Error(
      "events-ko.json has not been configured. Call configureLocalData({ events }) before interpreting dates."
    );
  }

  return eventsData;
}

export function getSeedRecommendationsData() {
  if (!seedRecommendationsData) {
    throw new Error(
      "seed-recommendations.json has not been configured. Call configureLocalData({ recommendations }) before ranking demo songs."
    );
  }

  return seedRecommendationsData;
}
