# Date Music Korea

Desktop-first, Korean date-based music recommendation prototype built with plain HTML, CSS, and vanilla JavaScript.

## Run In Demo Mode

Open `index.html` directly in a browser:

```text
file:///Users/joohyeongjoon/Documents/SDM/2026/Vibe%203/index.html
```

Optional date deep link:

```text
index.html?selected-date=2026-10-09
```

Demo mode needs no credentials. It uses `js/data/events-ko.js` and `js/data/seed-recommendations.js`.

## Apple Music Credentials

Edit `js/config/appleMusicConfig.example.js`.

Set:

```js
enabled: true
developerToken: "YOUR_DEVELOPER_TOKEN"
```

Then load MusicKit JS in `index.html` before `js/app.js`:

```html
<script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>
```

Do not commit real developer tokens. Generate the developer token outside the browser.

## Architecture

- `js/app.js` wires data, date context, scoring, rendering, and music provider state.
- `js/modules/dateContext.js` interprets Korean holidays, seasonal ranges, life events, and lunar mappings.
- `js/modules/recommendationEngine.js` scores and explains song recommendations.
- `js/modules/musicProvider.js` chooses Apple Music or demo fallback.
- `js/modules/uiRenderer.js` renders the HTML shell without owning recommendation logic.

## Future Improvements

- Add live Apple Music result enrichment per ranked seed recommendation.
- Add regional cherry blossom timing by city.
- Add user preference controls for genre, energy, and familiarity.
- Add preview playback for tracks that expose preview URLs.
- Add tests for lunar holiday windows and scoring regressions.
