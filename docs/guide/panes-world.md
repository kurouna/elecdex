English | [日本語](panes-world.ja.md) | [简体中文](panes-world.zh-CN.md)

# World panes: Orbit, Markets, Weather, RSS, Quakes and alerts — elecdex

elecdex is a science-fiction terminal emulator and system monitor, a rewrite of eDEX-UI on Electron, Svelte and TypeScript. This page covers the panes that show the world outside the computer: **Orbit** (the ISS, Tiangong and Starlink over a world map, computed on your computer from CelesTrak's orbital elements), **Markets** (Yahoo Finance quotes and charts), **Weather** (JMA in Japan, the US National Weather Service, MET Norway elsewhere), **RSS** (headlines from the feeds you list), **Quakes** (recent earthquakes from JMA or the USGS) and **Earthquake and tsunami alerts**. For each it states the data source with its terms and attribution, when and how often it is fetched, and what is never sent. elecdex runs on Windows, macOS and Linux; it is developed and used on Windows, and macOS and Linux have only been built and run by the automated tests, so they are not sufficiently verified.

On this page:

- [How these panes use the network](#how-these-panes-use-the-network)
- [The earth preset](#the-earth-preset)
- [Orbit](#orbit)
- [Markets](#markets)
- [Weather](#weather)
- [RSS](#rss)
- [Quakes](#quakes)
- [Earthquake and tsunami alerts](#earthquake-and-tsunami-alerts)
- [Design documents](#design-documents)

## How these panes use the network

The same rules hold for every pane on this page:

- **Only the app's main process connects**, never the page: the page is sandboxed and its content security policy allows no network (`connect-src 'self'`). There is no telemetry.
- **Fetched only while a pane needs the data.** A pane asks while it is on screen - not behind another tab, not in a minimised window. Quakes are the one exception: the earthquake list is also kept current while alerts are on. Closing the last pane that needs a source stops its requests.
- **Batched and conditional.** Several panes showing the same thing share one request (one quotes request for every symbol, one request per feed). Requests after the first carry `If-None-Match` or `If-Modified-Since`, so an unchanged answer is a 304 with no body.
- **Back off on failure, keep the last good data.** A failed request is retried later and later; the last good data stays on screen, and the pane is marked **STALE** where it applies.
- **Identified.** Weather, orbital elements, quakes and feeds are requested with the User-Agent `elecdex/<version> (+https://github.com/kurouna/elecdex)`.
- The tests never contact these services: every address is pointed at a closed port or a local stand-in.

The full list of every connection, with its terms, is on [Network access and data sources](data-sources.md).

## The earth preset

<p align="center">
  <img src="../screenshots/elecdex-earth.jpg" alt="The earth preset in the Tron theme: an ORBIT pane with the world map, time zone lines and nine cities' clocks, the ISS with its ground track, Tiangong, the Starlink satellites as faint dots and the card of one of them; beside it the world view, a quakes pane listing recent earthquakes in Japan, and the weather; a shell below the map">
  <br><sub>earth · Tron</sub>
</p>

The earth preset (Ctrl+Shift+F3) is stations overhead, the ground shaking below, and the sky: Orbit with a shell below it, and beside them the world view, Quakes and Weather, next to the system column. Where the other panes on this page are:

| Pane | In which presets | Picker name (Ctrl+Shift+A) | Panes per layout |
| --- | --- | --- | --- |
| Orbit | earth (Ctrl+Shift+F3) | orbit | several |
| Markets | standard, the default layout (Ctrl+Shift+F1) | markets | several |
| Weather | standard (Ctrl+Shift+F1), earth (Ctrl+Shift+F3) | weather | several |
| RSS | media (Ctrl+Shift+F5), in a tab behind X | rss | several |
| Quakes | earth (Ctrl+Shift+F3) | quakes | one (the picker focuses it) |

Every one of them can also be popped up over the workspace (▣ pop up in the picker) and brought forward to fill the screen (Ctrl+Shift+Z). Shortcuts are as bound by default and can be changed in *Settings → Keyboard*.

## Orbit

<p align="center">
  <img src="../screenshots/pane-orbit.jpg" alt="The Orbit pane on its own: a world map with the night side, time zone lines and the hour ruler, the ISS with its ground track and visibility ring, the GMT day-of-year clock and city clocks above, and the station's position, altitude, speed, light and next pass below">
  <br><sub>Orbit</sub>
</p>

| | |
| --- | --- |
| Where | earth preset (Ctrl+Shift+F3); picker "orbit" |
| Reads | Orbital elements from [CelesTrak](https://celestrak.org/): the stations (`GROUP=stations`, OMM JSON) and, on request, Starlink (`GROUP=starlink`, TLE). Positions are computed on your computer (SGP4); no service is asked where anything is. |
| Updates | Elements: the stations at most twice a day, Starlink at most once a day and only while a pane shows it. Drawing: moving things every second, the night side every minute. |
| Privacy | No location is asked for: the observer is a city chosen from the bundled list. |
| Settings | Per pane: the focused station (ISS or CSS), TRACK, TERMINATOR, CITIES, STARLINK, OBSERVER |
| Attribution | CelesTrak, from the 18th and 19th Space Defense Squadrons via Space-Track.org; time zones: timezone-boundary-builder, © OpenStreetMap contributors (ODbL); map: made with Natural Earth. Shown in the pane. |

What it shows - mission control's front screen:

- A world map with the night side (darkening smoothly to astronomical twilight), the thin lines where clocks differ today, and a ruler along the top that gives each fifteen-degree zone its hour, midnight and noon lit.
- Along the header, mission control's GMT day-of-year clock and nine city clocks (LAX, HOU, NYC, LON, MOW, DEL, BJS, TYO, SYD), each marked day or night.
- The ISS and Tiangong (CSS) where they are now. The focused station's track runs one orbit back and two ahead, bright in sunlight and dim in the Earth's shadow, marked every ten minutes; the ring round it is the ground that can see it.
- Below the map: where it is, how high and how fast, when it next enters or leaves the Earth's shadow, and its next pass over the observer - visible to the eye or not.
- **STARLINK** adds the roughly 10,000 Starlink satellites as dots. They are placed a portion each second, so each moves about every ten seconds.
- Rest the pointer near a station or a Starlink dot for its name, NORAD number, position, altitude and speed, sunlight or shadow, inclination and period, and the age of its elements (the focused station adds its next pass).

The observer is the pane's own, chosen with **OBSERVER** from the bundled city list (by default the largest city in your time zone, or London). It is not taken from the Weather pane, and no location is asked for.

How it follows CelesTrak's [usage policy](https://celestrak.org/usage-policy.php):

- CelesTrak updates the data every two hours and asks for at most one download per update. elecdex asks for the stations when its copy is over 12 hours old and for Starlink when its copy is over 24 hours old, and only while a pane shows the set.
- The elements are kept on disk across restarts (`orbits-stations.json`, `orbits-starlink.json` in the app's data folder).
- After any answer but a 200, nothing more is asked for a day (an hour when the network could not be reached). That pause is kept on disk too, so a restart does not cut it short.
- Sizes when designed: the stations about 9 KB; Starlink about 1.8 MB for 10,689 satellites.

## Markets

<p align="center">
  <img src="../screenshots/pane-markets.jpg" alt="The Markets pane on its own: a board of indices, currencies and Bitcoin with their changes and charts, and the range strip above">
  <br><sub>Markets</sub>
</p>

| | |
| --- | --- |
| Where | standard preset, the default layout (Ctrl+Shift+F1); picker "markets" |
| Reads | [Yahoo Finance](https://finance.yahoo.com/), through the yahoo-finance2 library |
| Updates | Only while a markets pane is on screen: one batched quotes request a minute for every symbol shown (every five minutes when every listed market is closed); each chart's bars every 5 minutes (1D), 15 minutes (5D), 30 minutes (1M) or hourly (6M and longer) |
| Settings | Per pane: the list of symbols and labels, the range, the chart style, the order |
| Terms | **Unofficial API, not endorsed by Yahoo. Quotes may be delayed and are not investment advice.** The pane says so: *Yahoo Finance via yahoo-finance2 · unofficial, may be delayed · not investment advice*. |

How to use it:

- Indices, currencies and anything Yahoo Finance quotes, as sparklines, candlesticks or bars of the change, in the list's order or sorted by the change.
- The rows share the pane: two columns when it is wide, one line each when it is short, and candles across the whole row under the name.
- Click a symbol and its chart takes the whole pane - with a price axis, the time along the bottom, the range's high, low and base, and a readout of the bar under the pointer - until the arrow takes you back to the list.
- The strip above the board picks the range:

  | Range | Bar |
  | --- | --- |
  | 1D | 5 minutes |
  | 5D | 30 minutes |
  | 1M | 1 hour |
  | 6M | 1 day |
  | 1Y | 1 week |
  | 5Y | 1 month |

- 1D measures from the previous close; longer ranges from the close before the range began.
- The settings button edits the list, each symbol optionally followed by a label: `^N225 日経平均, JPY=X ドル円, 7203.T トヨタ`.
- The default board: `^N225`, `TPY=F`, `^GSPC`, `^DJI`, `^IXIC`, `JPY=X`, `EURJPY=X`, `BTC-USD`. Yahoo has no live TOPIX index, so it shows the CME yen TOPIX future (`TPY=F`).
- Built-in names follow the app language; `--lang=en-US` forces English.

Network details:

- The minute's quotes extend the charts' bars between chart downloads.
- A failure keeps the last data on screen, marks the pane **STALE**, and is retried after 1, 2, then 5 minutes.
- A chart no pane shows any more is kept in memory for up to an hour (at most 32 of them), so a pane back from behind a tab asks for nothing.

## Weather

<p align="center">
  <img src="../screenshots/pane-weather.jpg" alt="The Weather pane on its own: today's weather and temperature, and the week's forecast with highs, lows and precipitation">
  <br><sub>Weather</sub>
</p>

| | |
| --- | --- |
| Where | standard (Ctrl+Shift+F1) and earth (Ctrl+Shift+F3) presets; picker "weather" |
| Reads | By place: JMA in Japan, the National Weather Service in the United States (or MET Norway, by choice), MET Norway everywhere else |
| Updates | Only while a pane shows the place: JMA around its publication times, NWS about hourly, MET Norway no sooner than its `Expires` (at least 30 minutes apart) |
| Privacy | Nothing typed in the place picker is sent anywhere: the city list is bundled. MET Norway is sent coordinates rounded to four decimals. |
| Settings | Per pane, under the settings button: **place**, **source** (US places), **area** (Japan), **week** (the week forecast on or off), °C or °F |

How to use it:

- The settings button → **place** opens a picker over a bundled list of large cities and capitals and JMA's forecast offices, or takes `lat, lon`. The default is New York City.
- °C or °F per pane; without a choice, US places are in °F and the rest in °C.
- A click on the forecast opens the source's own page for the place in the browser: JMA's forecast page, the NWS point forecast or yr.no.
- A place typed as `lat, lon` uses the system's time zone for its days, since no time zone data is bundled.

Providers by region:

| Region | Provider | What it gives | When it is asked | Terms and credit |
| --- | --- | --- | --- | --- |
| Japan | [Japan Meteorological Agency](https://www.jma.go.jp/) forecast JSON (`/bosai/forecast/data/forecast/<office code>.json`) | Three days of weather text and six-hour chances of precipitation, the week ahead | Around the publication times 0, 5, 11 and 17 o'clock JST (12 minutes before, 3 and 20 minutes after), conditionally | JMA's [terms of use](https://www.jma.go.jp/jma/kishou/info/coment.html). The pane shows 「出典：気象庁ホームページ（https://www.jma.go.jp/bosai/forecast/）を加工して作成」. |
| United States | [National Weather Service](https://www.weather.gov/) (api.weather.gov) | Day and night periods for a week, the current temperature | The point lookup kept for a day; the forecast about hourly | Open data. Credited *Source: National Weather Service (NOAA)*. |
| Everywhere else (and the US by choice) | [MET Norway](https://api.met.no/) Locationforecast 2.0 | Hourly, then six-hourly, for about nine days; amounts of precipitation | Never before the last answer's `Expires`, at least 30 minutes apart, with `If-Modified-Since` and a fixed offset of up to 90 seconds so not every user asks at once | [CC BY 4.0](https://api.met.no/doc/License), credited in the pane (*Weather data: MET Norway, CC BY 4.0 (summarised by elecdex)*); requests follow the [terms of service](https://api.met.no/doc/TermsOfService). |
| City list for the picker | [GeoNames](https://www.geonames.org/): cities of 500,000 people or more, and capitals (1,323 places) | Names, countries, coordinates, time zones | Bundled; never fetched | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

Notes:

- JMA's forecast JSON is the data JMA's own [forecast page](https://www.jma.go.jp/bosai/forecast/) loads, not a documented API. It is read directly, not scraped, and parsed leniently.
- Precipitation is shown as a chance (%) where the source gives one (JMA, NWS) and as an amount (mm) otherwise (MET Norway outside the Nordic area).
- A failure keeps the last forecast on screen and is retried after 5, 15, then 30 minutes - never sooner than the source allows.
- The last forecasts are kept on disk (`weather-cache.json`, `weather-cache-points.json` in the app's data folder), so a restart shows them at once and does not download a forecast that cannot have changed.

## RSS

<p align="center">
  <img src="../screenshots/pane-rss.jpg" alt="The RSS pane on its own: headlines from several feeds, newest first, each with its feed and time">
  <br><sub>RSS</sub>
</p>

| | |
| --- | --- |
| Where | media preset (Ctrl+Shift+F5), in a tab behind X; picker (Ctrl+Shift+A) "rss" |
| Reads | The RSS 2.0, RSS 1.0 or Atom feed URLs you list (up to 10 per pane) |
| Updates | Every 15 minutes while a pane lists the feed; less often only when the feed asks (Cache-Control, Expires or `<ttl>`), and never less than hourly |
| Privacy | Fetched by the app, never by the page; no cookies; nothing is sent to any other site. Headlines are shown as plain text. |
| Settings | Per pane: the feed URLs, one per line, under the settings button |

How to use it:

- It starts empty and fetches nothing until its settings button lists feed URLs.
- The newest 20 headlines across its feeds are shown, each with its feed and the time (today) or date (earlier); the list scrolls when the pane is shorter. A click opens the article in the browser.
- A headline that arrives while the pane is open slides in at its place and is highlighted for three seconds. If the list is scrolled down, what is being read stays put and a *↑ n new* pill leads back up.

Network details:

- Conditional requests (`If-None-Match`, `If-Modified-Since`), so an unchanged feed is not downloaded again. At most two feeds are fetched at once, up to 2 MB each (a larger one is refused, not parsed in part), with the User-Agent named above.
- Several panes listing the same feed share one request, and closing the last one stops it.
- A feed that fails keeps its last headlines and marks the pane **STALE**. It is retried after 5, 15, 30, then 60 minutes, or later if the server's `Retry-After` says so (up to a day).
- The last headlines per feed are kept in `feeds-cache.json` in the app's data folder, so a restart shows them at once (a feed not checked for 30 days is forgotten; at most 50 feeds are kept).

## Quakes

<p align="center">
  <img src="../screenshots/pane-quakes.jpg" alt="The Quakes pane on its own: recent earthquakes newest first, each with its intensity or magnitude badge, place, time, magnitude and depth">
  <br><sub>Quakes</sub>
</p>

| | |
| --- | --- |
| Where | earth preset (Ctrl+Shift+F3); picker "quakes". One per layout. |
| Reads | The source chosen in *Settings → Alerts*: **Japan** (JMA's earthquake and tsunami lists) or **the world** (the USGS feed and NOAA's tsunami centres) |
| Updates | Every minute while the pane is seen (not behind another tab or in a minimised window) or alerts are on; with neither, nothing is fetched |
| Settings | The source and the alerts, in *Settings → Alerts* (the pane's settings button opens them) |
| Attribution | JMA: 「出典：気象庁ホームページ（URL）を加工して作成」 in the pane. The USGS and NOAA are named. |

**Not an earthquake early warning.** Reports come a minute or more after the shaking, and the pane and the alerts say so.

What it shows:

- Recent earthquakes, newest first. Each row has the place, time, magnitude and depth, and opens the source's page.

  | Source | Badge | Amber from | Red from |
  | --- | --- | --- | --- |
  | Japan (JMA) | Maximum seismic intensity (shindo), including distant earthquakes JMA reports | 3 | 5- |
  | The world (USGS) | Magnitude, 4.5 and up | 5 | 6 |

- A tsunami warning, watch or advisory in effect shows as a strip above the list.
- The pane shows what alerts are set to, and its settings button opens them.
- A new earthquake slides in highlighted in its colour, with the same *↑ n new* pill as the RSS pane when the list is scrolled down.
- While the list is kept current, the world view marks the day's earthquakes at their epicentres, sized by magnitude and coloured like the list; an earthquake from the last hour pulses. With alerts on, the CLUSTER pane shows a QUAKE lamp.

Sources:

| Data | Source | Notes |
| --- | --- | --- |
| Earthquakes, Japan | JMA earthquake list JSON (`/bosai/quake/data/list.json`) | The data JMA's own [earthquake page](https://www.jma.go.jp/bosai/map.html#contents=earthquake_map) loads, about a month of reports. Once a minute, as its `max-age=60` asks, with `If-None-Match`. Used under JMA's [terms of use](https://www.jma.go.jp/jma/kishou/info/coment.html). Not JMA's Earthquake Early Warning. |
| Tsunamis, Japan | JMA tsunami list JSON (`/bosai/tsunami/data/list.json`) and each report it names | Checked with the earthquake list (usually an empty list, a 304 after the first request); a new report's details are fetched once. Warnings, major warnings and advisories count; forecasts and liftings do not. Credited like the earthquakes. |
| Earthquakes, world | [USGS](https://earthquake.usgs.gov/) real-time feed `summary/4.5_day.geojson` | Public domain. Once a minute (its `max-age=60`), conditionally. |
| Tsunamis, world | [NOAA Tsunami Warning Centers](https://www.tsunami.gov/): Pacific (`PHEBAtom.xml`) and National (`PAAQAtom.xml`) Atom feeds | Public domain. Each holds the centre's latest bulletin; warnings, watches, advisories and threat messages count, information statements do not. Checked with the USGS feed, conditionally. |

- A failed earthquake list keeps the last one, marks the pane **STALE**, and is retried after 1, 2, 5, then 10 minutes. A failed tsunami check keeps the last tsunami state and is tried again on the next minute.

## Earthquake and tsunami alerts

| | |
| --- | --- |
| Where | *Settings → Alerts* (`quakes` in `settings.json`) |
| Default | **Off** |
| Reads | The same sources as the Quakes pane, checked every minute while alerts are on, with or without a Quakes pane |
| Attribution | Every banner and card names its source: *Source: JMA*, *Source: USGS* or *Source: NOAA Tsunami Warning Centers* (in Japanese, 出典：気象庁, 出典：USGS, 出典：NOAA 津波警報センター) |

Settings:

| Setting | Choices | Default |
| --- | --- | --- |
| source | automatic (Japan when the system time zone is Tokyo or the locale is ja-JP, the world otherwise), Japan · Japan Meteorological Agency, world · USGS, tsunamis from NOAA | automatic |
| alerts | on, off | off |
| earthquakes at a maximum intensity of (Japan) | 1, 2, 3, 4, 5-, 5+, 6-, 6+, 7 | 5- (5弱) |
| earthquakes of magnitude (world) | 4.5, 5, 5.5, 6, 6.5, 7, 7.5 | 6.0 |
| tsunami warnings, watches and advisories | on, off | on |
| system notification when elecdex is not in front | on, off | on |
| alert sound (with interface sounds on) | on, off | on |

What happens when they are on:

- **Earthquakes:** one at or above the chosen intensity or magnitude shows a banner at the top of the screen with the place, intensity or magnitude and depth, updated as later reports arrive. A severe one (intensity 5- or more, or magnitude 6 or more) stays until closed; a weaker one goes after a minute. Each banner says *not an earthquake early warning*.
- **Tsunamis:** a warning, watch or advisory - JMA's 大津波警報・津波警報・津波注意報 for Japan, NOAA's Pacific and National Tsunami Warning Centers for the world - shows a card with its level, the areas with expected arrival and height, and the issuer's headline. Closing it folds it into a small tab while it is in effect; when it is lifted, the card says so. A raised level is announced again. **The card tells you to follow local authorities** (in Japanese: 避難の判断は自治体・気象庁の情報に従ってください). The tsunami alerts can be turned off.
- An alert sound plays (with interface sounds on), and a system notification appears when elecdex is not in front; both can be turned off.
- Each earthquake is announced once, and only while recent (30 minutes for Japan, an hour for the world), so starting the app later does not announce old news. What was announced is kept in `quake-alerts.json` in the app's data folder, so a restart does not announce it again.

## Design documents

In Japanese:

- [architecture.md](../architecture.md): §5.10 Orbit, and §11 for the network rules
- [weather-providers.md](../weather-providers.md): the weather providers, their terms, and how each is asked
- [decisions.md](../decisions.md): decisions with reasons and measured numbers
- [Network access and data sources](data-sources.md)
