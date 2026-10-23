import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { type StubReply, type StubRequest, serviceStub } from '../support/stubs/services.js'
import {
  type Launched,
  type LaunchOptions,
  launch,
  openSettings,
  pluginFiles,
  quietFor,
  removeDir,
  SINGLE_CLOCK,
  single,
  turnOnPlugin,
} from '../support.js'

/**
 * The faults contract (docs/e2e-design.md, sections 3.1-3.2). External: each data source, served
 * from a local stand-in, first answers well, then answers garbage, then not at all; through both
 * failures its pane keeps what it last drew and says it is old - and where nothing good ever came,
 * the pane says what went wrong instead of standing blank. Internal: a plugin that throws or stops
 * answering, store files that cannot be parsed at start, a shell that cannot start, and the
 * metrics collector dying - each is said, and the rest of the app goes on.
 *
 * A source is asked again the way the app allows: a reload (quakes), a press (markets' range, the
 * update check's "check now"), or a restart on the same profile with the cache aged so it is due
 * (weather, feeds, ORBIT), since those remember on disk when they last asked.
 */

const fixture = (name: string) =>
  readFileSync(new URL(`../../unit/fixtures/${name}`, import.meta.url), 'utf8')

const GARBAGE: StubReply = {
  status: 200,
  headers: { 'content-type': 'application/json' },
  body: 'not json <html>',
}
const json = (body: string, headers: Record<string, string> = {}): StubReply => ({
  status: 200,
  headers: { 'content-type': 'application/json', ...headers },
  body,
})

type Mode = 'good' | 'garbage'

/** How the app is made to ask the source again. */
type Again =
  | { reload: true }
  | { press: (page: Page, time: number) => Promise<void> }
  /** Quit, rewrite these files of the profile (the cache made due), start again. */
  | { restart: (userData: string) => Record<string, string> }

interface SourceRow {
  name: string
  /** The stand-in's answer to a request, in each mode; undefined for a 404. */
  serve(mode: Mode, request: StubRequest, origin: string): StubReply | undefined
  /** How to start the app against the stand-in at `origin`. */
  launch(origin: string): LaunchOptions
  again: Again
  /** Asks once after the start before anything is drawn (the update check waits a quarter minute). */
  kick?: true
  /** The pane drawing what the source sent. */
  drawn(page: Page): Promise<void>
  /** The pane saying what it shows is old. */
  old(page: Page): Promise<void>
  /** The pane saying what went wrong, with nothing to show. */
  failed(page: Page): Promise<void>
  /** What main says went wrong last, or null; absent where no reader tells it apart. */
  error?(page: Page): Promise<string | null>
  /** Why the last good result is not kept, where by design it is not. */
  keepsNothing?: string
}

const pane = (page: Page, widget: string): Locator =>
  page.locator(`[data-testid=pane][data-widget=${widget}]`)
const badge = (page: Page, widget: string) => pane(page, widget).getByTestId('pane-badge')

/** A cache file of the profile with each entry's fields set, as text for `files`. */
function aged(
  userData: string,
  file: string,
  change: (entry: Record<string, unknown>) => Record<string, unknown>,
  whole = false,
): Record<string, string> {
  const at = path.join(userData, file)
  if (!existsSync(at)) return {}
  const parsed = JSON.parse(readFileSync(at, 'utf8')) as Record<string, unknown> | null
  if (parsed === null) return {}
  const next = whole
    ? change(parsed)
    : Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [k, change(v as Record<string, unknown>)]),
      )
  return { [file]: JSON.stringify(next) }
}

/** What main last said for the one weather place being kept. */
async function weatherError(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const [key] = await window.elecdex.weather.watching()
    if (key === undefined) return 'nothing watched'
    // A JMA office is watched as jma:<office>, which is also its location key.
    return new Promise<string | null>((resolve) => {
      const off = window.elecdex.weather.subscribe(key, (update) => {
        resolve(update.error)
        queueMicrotask(() => off())
      })
    })
  })
}

const weather = (
  name: string,
  state: Record<string, unknown> | undefined,
  routes: (url: string, origin: string) => StubReply | undefined,
  cache: string,
  due: (entry: Record<string, unknown>) => Record<string, unknown>,
): SourceRow => ({
  name,
  serve: (mode, { url }, origin) => {
    const good = routes(url, origin)
    return good === undefined ? undefined : mode === 'good' ? good : GARBAGE
  },
  launch: (origin) => ({
    layout: single('weather', state === undefined ? { id: 'w' } : { id: 'w', state }),
    jmaBaseUrl: `${origin}/bosai`,
    env: { ELECDEX_MET_BASE_URL: `${origin}/weatherapi`, ELECDEX_NWS_BASE_URL: `${origin}/nws` },
  }),
  again: { restart: (userData) => aged(userData, cache, due) },
  drawn: (page) => expect(pane(page, 'weather').getByTestId('weather-today')).toBeVisible(),
  old: (page) => expect(badge(page, 'weather')).toHaveText('offline'),
  failed: (page) =>
    expect(pane(page, 'weather').getByTestId('weather-status')).toContainText(
      'forecast unavailable',
    ),
  error: weatherError,
})

/** MET Norway's capture, its hours moved to begin now (a forecast of the past shows no week). */
function metForecastNow(): string {
  const forecast = JSON.parse(fixture('met-london.json'))
  const series: Array<{ time: string }> = forecast.properties.timeseries
  const hour = 3_600_000
  const shift = Math.floor(Date.now() / hour) * hour - Date.parse(series[0]?.time ?? '')
  for (const step of series)
    step.time = new Date(Date.parse(step.time) + shift).toISOString().replace('.000Z', 'Z')
  return JSON.stringify(forecast)
}

const TEST = '[TEST] '

/** A JMA list.json entry `minutesAgo` minutes before now (as quakes.spec writes them). */
function jmaQuake(eid: string, minutesAgo: number) {
  const at = new Date(Date.now() - minutesAgo * 60_000).toISOString()
  return {
    ctt: eid,
    eid,
    rdt: at,
    ttl: '震源・震度情報',
    ift: '発表',
    ser: '1',
    at,
    anm: `${TEST}試験`,
    en_anm: `${TEST}Test`,
    cod: '+31.2+146.8-40000/',
    mag: '4.1',
    maxi: '3',
  }
}

const usgsFeed = () =>
  JSON.stringify({
    features: [
      {
        id: 'e2etest1',
        properties: {
          type: 'earthquake',
          time: Date.now() - 10 * 60_000,
          mag: 5.2,
          place: `${TEST}Corallin Islands region`,
          url: 'https://earthquake.usgs.gov/',
        },
        geometry: { coordinates: [-150.6, -24.1, 30] },
      },
    ],
  })

/** What main last said about the earthquake list. */
const quakeError = (page: Page): Promise<string | null> =>
  page.evaluate(
    () =>
      new Promise<string | null>((resolve) => {
        const off = window.elecdex.quakes.observe((state) => {
          resolve(state.error)
          queueMicrotask(() => off())
        })
      }),
  )

const quakes = (name: string, source: 'jma' | 'usgs'): SourceRow => ({
  name,
  serve: (mode, { url }) => {
    if (source === 'jma' && url === '/bosai/quake/data/list.json') {
      return mode === 'good' ? json(JSON.stringify([jmaQuake('e2e1', 5)])) : GARBAGE
    }
    if (source === 'usgs' && url === '/usgs/earthquakes/feed/v1.0/summary/4.5_day.geojson') {
      return mode === 'good' ? json(usgsFeed()) : GARBAGE
    }
    if (url === '/bosai/tsunami/data/list.json') return json('[]')
    return undefined
  },
  launch: (origin) => ({
    layout: single('quakes', { id: 'q' }),
    settings: { quakes: { source, notify: false } },
    jmaBaseUrl: `${origin}/bosai`,
    env: { ELECDEX_USGS_BASE_URL: `${origin}/usgs`, ELECDEX_NOAA_BASE_URL: `${origin}/noaa` },
  }),
  // Leaving the page lets the list go inactive; coming back asks at once.
  again: { reload: true },
  drawn: (page) => expect(pane(page, 'quakes').getByTestId('quake-row').first()).toBeVisible(),
  old: (page) => expect(badge(page, 'quakes')).toHaveText('stale'),
  failed: (page) =>
    expect(pane(page, 'quakes').getByTestId('quakes-status')).toContainText(
      'could not read the earthquake list',
    ),
  error: quakeError,
})

const FEED = '/feed.xml'

function rss(origin: string): string {
  const items = Array.from({ length: 5 }, (_, i) => {
    const at = new Date(Date.now() - (i + 1) * 3_600_000)
    return `<item><title>${TEST}story ${i + 1}</title><link>${origin}/story/${i + 1}</link><pubDate>${at.toUTCString()}</pubDate></item>`
  }).join('')
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>${TEST}news</title>${items}</channel></rss>`
}

const STATIONS = readFileSync(
  new URL('../../fixtures/orbits/stations.json', import.meta.url),
  'utf8',
)

const RELEASE = JSON.stringify({
  tag_name: 'v99.0.0',
  html_url: 'https://github.com/kurouna/elecdex/releases/tag/v99.0.0',
  draft: false,
  prerelease: false,
})

const MARKET_SYMBOL = '^N225'

/** The ranges pressed in turn: a chart not yet kept makes main ask at once. */
const PRESSED_RANGES = ['5d', '1mo', '6mo', '1y']

const SOURCES: SourceRow[] = [
  weather(
    'weather, JMA',
    { location: { source: 'jma', office: '130000', name: '東京都' } },
    (url) =>
      /^\/bosai\/forecast\/data\/forecast\/\d{6}\.json$/.test(url)
        ? json(fixture('jma-forecast-130000.json'))
        : undefined,
    'weather-cache.json',
    (entry) => ({ ...entry, checkedAt: 0 }),
  ),
  weather(
    'weather, MET Norway',
    {
      location: {
        source: 'met',
        lat: 51.5085,
        lon: -0.1257,
        name: 'London',
        country: 'GB',
        timeZone: 'Europe/London',
      },
    },
    (url) =>
      url.startsWith('/weatherapi/locationforecast/2.0/complete?')
        ? json(metForecastNow(), {
            expires: new Date(Date.now() + 3_600_000).toUTCString(),
            'last-modified': new Date().toUTCString(),
          })
        : undefined,
    'weather-cache-points.json',
    (entry) => ({ ...entry, expiresAt: 0 }),
  ),
  weather(
    'weather, National Weather Service',
    undefined,
    (url, origin) => {
      if (url.startsWith('/nws/points/')) {
        const point = JSON.parse(fixture('nws-point-nyc.json'))
        point.properties.forecast = `${origin}/nws/gridpoints/OKX/33,42/forecast`
        point.properties.forecastHourly = `${origin}/nws/gridpoints/OKX/33,42/forecast/hourly`
        return json(JSON.stringify(point))
      }
      if (url.endsWith('/forecast/hourly')) return json(fixture('nws-hourly-nyc.json'))
      if (url.endsWith('/forecast')) return json(fixture('nws-forecast-nyc.json'))
      return undefined
    },
    'weather-cache-points.json',
    (entry) => ({ ...entry, expiresAt: 0 }),
  ),
  {
    name: 'markets',
    serve: (mode, { url }) => {
      const parsed = new URL(url, 'http://stub')
      if (parsed.pathname === '/quotes') {
        if (mode === 'garbage') return GARBAGE
        const symbols = (parsed.searchParams.get('symbols') ?? '').split(',')
        return json(
          JSON.stringify(
            symbols.map((symbol) => ({
              symbol,
              name: `${symbol} name`,
              price: 1000,
              change: 12.5,
              changePercent: 1.25,
              previousClose: 990,
              currency: 'JPY',
              state: 'open',
              time: Date.now(),
            })),
          ),
        )
      }
      if (parsed.pathname.startsWith('/chart/')) {
        const now = Date.now()
        return json(
          JSON.stringify(
            Array.from({ length: 30 }, (_, i) => ({ t: now - (30 - i) * 60_000, v: 990 + i })),
          ),
        )
      }
      return undefined
    },
    launch: (origin) => ({
      layout: single('markets', {
        id: 'm',
        state: { symbols: [{ symbol: MARKET_SYMBOL, label: '日経平均' }] },
      }),
      env: { ELECDEX_MARKETS_STUB_URL: origin },
    }),
    again: {
      press: (page, time) =>
        pane(page, 'markets')
          .locator(`[data-testid=markets-ranges] [data-range="${PRESSED_RANGES[time % 4]}"]`)
          .click(),
    },
    drawn: (page) =>
      expect(pane(page, 'markets').getByTestId('market-price').first()).toHaveText('1,000'),
    old: (page) => expect(badge(page, 'markets')).toHaveText('stale'),
    failed: (page) =>
      expect(pane(page, 'markets').getByTestId('market-row').first()).toContainText(
        /fetch failed|HTTP|ECONN|JSON/i,
      ),
  },
  {
    name: 'RSS',
    serve: (mode, { url }, origin) =>
      url === FEED
        ? mode === 'good'
          ? { status: 200, headers: { 'content-type': 'application/rss+xml' }, body: rss(origin) }
          : {
              status: 200,
              headers: { 'content-type': 'application/rss+xml' },
              body: 'not a feed <',
            }
        : undefined,
    launch: (origin) => ({
      layout: single('rss', { id: 'r', state: { feeds: [`${origin}${FEED}`] } }),
    }),
    again: {
      restart: (userData) =>
        aged(userData, 'feeds-cache.json', (entry) => ({
          ...entry,
          checkedAt: Date.now() - 16 * 60_000,
          fetchedAt: Date.now() - 16 * 60_000,
        })),
    },
    drawn: (page) => expect(pane(page, 'rss').getByTestId('rss-item')).toHaveCount(5),
    old: (page) => expect(badge(page, 'rss')).toHaveText('stale'),
    failed: (page) =>
      expect(pane(page, 'rss').getByTestId('rss-status')).toContainText('could not read the feeds'),
    error: (page) =>
      page.evaluate(async () => {
        const [url] = await window.elecdex.feeds.watching()
        if (url === undefined) return 'nothing watched'
        return new Promise<string | null>((resolve) => {
          const off = window.elecdex.feeds.subscribe(url, (update) => {
            resolve(update.error)
            queueMicrotask(() => off())
          })
        })
      }),
  },
  quakes('earthquakes, JMA', 'jma'),
  quakes('earthquakes, USGS', 'usgs'),
  {
    name: 'ORBIT, CelesTrak',
    serve: (mode, { url }) =>
      url.includes('GROUP=stations') ? (mode === 'good' ? json(STATIONS) : GARBAGE) : undefined,
    launch: (origin) => ({ layout: single('orbit', { id: 'o' }), celestrakBaseUrl: origin }),
    // After any answer but a 200 main waits a day (CLAUDE.md, ORBIT): the stand-in profile is made
    // due again, its elements kept.
    again: {
      restart: (userData) =>
        aged(
          userData,
          'orbits-stations.json',
          (entry) => ({
            ...entry,
            fetchedAt: Date.now() - 13 * 3_600_000,
            error: null,
            quietUntil: null,
          }),
          true,
        ),
    },
    drawn: (page) =>
      expect(pane(page, 'orbit').getByTestId('orbit-pos')).toHaveText(/°[NS] .*°[EW]/),
    old: (page) => expect(badge(page, 'orbit')).toHaveText('CelesTrak'),
    failed: async (page) => {
      await expect(pane(page, 'orbit').getByTestId('orbit-pos')).toHaveText('—')
      await expect(pane(page, 'orbit').getByTestId('orbit')).toContainText('CelesTrak')
    },
    error: (page) =>
      page.evaluate(
        () =>
          new Promise<string | null>((resolve) => {
            const off = window.elecdex.orbits.subscribe('stations', (update) => {
              resolve(update.error)
              queueMicrotask(() => off())
            })
          }),
      ),
  },
  {
    name: 'update check',
    serve: (mode, { url }) =>
      url === '/releases/latest' ? (mode === 'good' ? json(RELEASE) : GARBAGE) : undefined,
    launch: (origin) => ({
      layout: SINGLE_CLOCK,
      env: { ELECDEX_UPDATES_URL: `${origin}/releases/latest` },
    }),
    again: {
      press: async (page) => {
        if (!(await page.getByTestId('settings-dialog').isVisible())) {
          await openSettings(page, 'updates')
        }
        await page.getByTestId('settings-updates-now').click()
      },
    },
    kick: true,
    drawn: (page) =>
      expect(page.getByTestId('settings-updates-status')).toHaveAttribute(
        'data-state',
        'available',
      ),
    old: async () => {},
    failed: async (page) => {
      const status = page.getByTestId('settings-updates-status')
      await expect(status).toHaveAttribute('data-state', 'error')
      await expect(status).toContainText('could not check')
    },
    error: (page) =>
      page.evaluate(async () => {
        const status = await window.elecdex.updates.status()
        return status.state === 'error' ? status.error : null
      }),
    keepsNothing:
      'each check replaces the last (updates/checker.ts): a failed one is said, the release it found before is not kept',
  },
]

/** One app against a stand-in whose answers can turn bad, and a way to make the app ask again. */
async function against(row: SourceRow) {
  let mode: Mode = 'good'
  let origin = ''
  const stub = await serviceStub((request) => row.serve(mode, request, origin) ?? { status: 404 })
  origin = stub.origin
  let launched: Launched | null = null
  let profile: string | null = null
  let presses = 0
  const page = () => {
    if (launched === null) throw new Error('not started')
    return launched.page
  }
  return {
    set mode(next: Mode) {
      mode = next
    },
    page,
    start: async () => {
      launched = await launch(undefined, row.launch(origin))
      profile = launched.userData
      if (row.kick && 'press' in row.again) await row.again.press(page(), presses++)
    },
    /** The stand-in stops answering: its port is closed. */
    silence: () => stub.close(),
    again: async () => {
      if (launched === null || profile === null) throw new Error('not started')
      if ('reload' in row.again) {
        await launched.page.reload()
        await expect(launched.page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
      } else if ('press' in row.again) {
        await row.again.press(launched.page, presses++)
      } else {
        await launched.quit()
        const files = row.again.restart(profile)
        const { layout: _first, ...options } = row.launch(origin)
        launched = await launch(profile, { ...options, files })
      }
    },
    dispose: async () => {
      await launched?.quit()
      if (profile !== null) removeDir(profile)
      await stub.close().catch(() => undefined)
    },
  }
}

/** Waits for main to say something went wrong, other than `before`; answers it. */
async function freshError(
  row: SourceRow,
  page: Page,
  before: string | null,
): Promise<string | null> {
  if (row.error === undefined) return null
  let now: string | null = null
  await expect
    .poll(
      async () => {
        now = (await row.error?.(page)) ?? null
        return now !== null && now !== before
      },
      { timeout: 45_000, message: `${row.name}: a new error from main` },
    )
    .toBe(true)
  return now
}

for (const row of SOURCES) {
  test(`${row.name}: answering garbage, then nothing, keeps the last good data and says it is old`, async () => {
    test.setTimeout(240_000)
    const world = await against(row)
    try {
      await world.start()
      await expect(async () => row.drawn(world.page())).toPass({ timeout: 30_000 })

      world.mode = 'garbage'
      await world.again()
      const garbage = await freshError(row, world.page(), null)
      if (row.keepsNothing !== undefined) {
        await row.failed(world.page())
      } else {
        await row.drawn(world.page())
        await row.old(world.page())
      }

      await world.silence()
      await world.again()
      await freshError(row, world.page(), garbage)
      if (row.keepsNothing !== undefined) {
        await row.failed(world.page())
      } else {
        await row.drawn(world.page())
        await row.old(world.page())
      }
    } finally {
      await world.dispose()
    }
  })

  test(`${row.name}: with nothing good yet, garbage and then silence are said, not a blank pane`, async () => {
    test.setTimeout(240_000)
    const world = await against(row)
    try {
      world.mode = 'garbage'
      await world.start()
      await expect(async () => row.failed(world.page())).toPass({ timeout: 45_000 })
      const garbage = await freshError(row, world.page(), null)

      await world.silence()
      await world.again()
      await freshError(row, world.page(), garbage)
      await row.failed(world.page())
    } finally {
      await world.dispose()
    }
  })
}

/* ---------------- a tsunami from NOAA ---------------- */

const NTWC_FEED = '/noaa/events/xml/PAAQAtom.xml'

/** A NOAA warning issued eight minutes ago (as quakes.spec makes one from the capture). */
function noaaWarning(): string {
  const updated = new Date(Date.now() - 8 * 60_000).toISOString().replace(/\.\d+Z$/, 'Z')
  return fixture('quakes/noaa-paaq-information.xml')
    .replace('<strong>Category:</strong> Information', '<strong>Category:</strong> Warning')
    .replaceAll('2026-09-11T10:49:50Z', updated)
    .replaceAll('110 miles SE of Kestrel Point', `${TEST}110 miles SE of Kestrel Point`)
}

async function noaaWorld(): Promise<{
  launched: Launched
  tsunami: Locator
  routes: Record<string, string>
  /** How many times the national centre's feed has been asked for. */
  asked: () => number
  silence: () => Promise<void>
  close: () => Promise<void>
}> {
  const stub = await serviceStub()
  stub.routes = {
    '/usgs/earthquakes/feed/v1.0/summary/4.5_day.geojson': usgsFeed(),
    [NTWC_FEED]: noaaWarning(),
  }
  const launched = await launch(undefined, {
    layout: single('quakes', { id: 'q' }),
    settings: { quakes: { source: 'usgs', notify: false } },
    env: {
      ELECDEX_USGS_BASE_URL: `${stub.origin}/usgs`,
      ELECDEX_NOAA_BASE_URL: `${stub.origin}/noaa`,
    },
    args: ['--lang=en-US'],
  })
  const tsunami = pane(launched.page, 'quakes').getByTestId('quakes-tsunami')
  await expect(tsunami).toHaveAttribute('data-level', 'warning', { timeout: 30_000 })
  return {
    launched,
    tsunami,
    routes: stub.routes,
    asked: () => stub.requests.filter((r) => r.url.endsWith(NTWC_FEED)).length,
    silence: () => stub.close(),
    close: async () => {
      await launched.close()
      await stub.close().catch(() => undefined)
    },
  }
}

test('tsunami, NOAA: unreachable, the warning in effect stays', async () => {
  const world = await noaaWorld()
  try {
    await world.silence()
    await world.launched.page.reload()
    await expect(world.launched.page.getByTestId('workspace')).toHaveAttribute(
      'data-loaded',
      'true',
    )
    await expect(world.tsunami).toHaveAttribute('data-level', 'warning')
  } finally {
    await world.close()
  }
})

test('tsunami, NOAA: answering garbage, the warning in effect stays', async () => {
  // An answer that is no Atom feed fails and keeps the warning (quakes/service.ts); before
  // 2026-10-23 it read as "no tsunami" and lifted it.
  const world = await noaaWorld()
  try {
    world.routes[NTWC_FEED] = 'not xml <'
    const before = world.asked()
    await world.launched.page.reload()
    await expect(world.launched.page.getByTestId('workspace')).toHaveAttribute(
      'data-loaded',
      'true',
    )
    // The garbage was served (on the reload's ask, or the next minute's at most), and the
    // warning is still in effect after it.
    await expect.poll(world.asked, { timeout: 75_000 }).toBeGreaterThan(before)
    await expect(world.tsunami).toHaveAttribute('data-level', 'warning')
    await quietFor(2000, () => world.tsunami.getAttribute('data-level'), 'the tsunami level')
  } finally {
    await world.close()
  }
})

/* ---------------- internal faults ---------------- */

const PLUGIN_LAYOUT = (id: string) => single(`plugin:${id}`, { id: 'p1' })
const pluginPane = (page: Page) =>
  page.locator('[data-testid=pane][data-pane-id="p1"] [data-testid=plugin-pane]')

test('a plugin that throws as it draws says so in its pane, and the workspace goes on', async () => {
  const { page, close } = await launch(undefined, {
    layout: PLUGIN_LAYOUT('thrower'),
    files: pluginFiles({
      'thrower.js': `export default { apiVersion: 1, id: 'thrower', title: 'thrower',
        view() { throw new Error('boom') } }`,
    }),
  })
  try {
    await turnOnPlugin(page, 'thrower')
    await expect(pluginPane(page).getByTestId('plugin-error')).toContainText('Error: boom')
    await expect(page.getByTestId('pane-fault')).toHaveCount(0)
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
  } finally {
    await close()
  }
})

test('a plugin that stops answering is stopped and says so, and the workspace goes on', async () => {
  const { page, close } = await launch(undefined, {
    layout: PLUGIN_LAYOUT('spinner'),
    files: pluginFiles({
      'spinner.js': `export default { apiVersion: 1, id: 'spinner', title: 'spinner',
        view(ctx) { ctx.render([{ t: 'buttons', items: [{ action: 'spin', text: 'spin' }] }])
          ctx.on('action', () => { for (;;) {} }) } }`,
    }),
  })
  try {
    await turnOnPlugin(page, 'spinner')
    await pluginPane(page).locator('[data-testid=plugin-button][data-action=spin]').click()
    await expect(pluginPane(page).getByTestId('plugin-stopped')).toContainText(
      'stopped responding',
      { timeout: 15_000 },
    )
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
  } finally {
    await close()
  }
})

/** A store file that cannot be read at start, and what becomes of it. */
interface BrokenFile {
  file: string
  /** `kept`: left as it is until the first write (keepInvalid); `aside`: moved to <file>.bak at once. */
  fate: 'kept' | 'aside'
}

const BROKEN = '{ "this": is not json'

const BROKEN_FILES: BrokenFile[] = [
  { file: 'settings.json', fate: 'kept' },
  { file: 'layout.json', fate: 'aside' },
  { file: 'layouts.json', fate: 'aside' },
  { file: 'notes.json', fate: 'kept' },
  { file: 'tasks.json', fate: 'kept' },
  { file: 'alarms.json', fate: 'kept' },
  { file: 'snippets.json', fate: 'kept' },
]

test('store files that cannot be parsed at start: the app starts, and none is lost', async () => {
  // Settings that cannot be read are the defaults, sound and all, while this app runs.
  const launched = await launch(undefined, {
    files: Object.fromEntries(BROKEN_FILES.map((b) => [b.file, BROKEN])),
  })
  const { page, userData } = launched
  try {
    await expect(page.getByTestId('pane').first()).toBeVisible()
    await expect(page.getByTestId('pane-fault')).toHaveCount(0)
    const failed: Record<string, string> = {}
    for (const { file, fate } of BROKEN_FILES) {
      const at = path.join(userData, file)
      const where = fate === 'kept' ? at : `${at}.bak`
      try {
        await expect
          .poll(() => (existsSync(where) ? readFileSync(where, 'utf8') : null), {
            message: `${file} ${fate}`,
          })
          .toBe(BROKEN)
      } catch (error) {
        failed[file] = String((error as Error).message).split('\n')[0] ?? ''
      }
    }
    expect(failed).toEqual({})
  } finally {
    await launched.close()
  }
})

// A shell that cannot start is not checked here: the shell has no setting (user decision
// 2026-10-13), and a ComSpec given to the app's environment loses to the one Windows already has,
// so the test side cannot make it missing (tried 2026-10-23). docs/e2e-design.md lists it.

test('the metrics collector dying is restarted, and the panes it feeds go on', async () => {
  const { app, page, close } = await launch(undefined, { layout: single('cpu', { id: 'c' }) })
  const collector = () =>
    app.evaluate(({ app: electronApp }) => {
      const found = electronApp
        .getAppMetrics()
        .find((m) => m.type === 'Utility' && m.name === 'elecdex metrics')
      return found?.pid ?? null
    })
  try {
    await expect.poll(collector, { timeout: 15_000 }).not.toBeNull()
    await expect
      .poll(async () => (await page.evaluate(() => window.elecdex.metrics.stats())).running)
      .toBe(true)
    const pid = await collector()
    await app.evaluate((_electron, target) => process.kill(target as number), pid)
    // Back with a new process (main waits half a second first), sampling again.
    await expect
      .poll(
        async () => {
          const now = await collector()
          return now !== null && now !== pid
        },
        { timeout: 20_000 },
      )
      .toBe(true)
    await expect
      .poll(async () => (await page.evaluate(() => window.elecdex.metrics.stats())).running, {
        timeout: 20_000,
      })
      .toBe(true)
    await expect(page.getByTestId('pane-fault')).toHaveCount(0)
  } finally {
    await close()
  }
})
