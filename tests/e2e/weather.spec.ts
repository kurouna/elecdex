import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch, selectedRow } from './support.js'

/**
 * The weather pane, against local stand-ins for JMA, MET Norway and the NWS.
 *
 * Each server serves a real response captured from the service and counts
 * requests - the point being that the app asks rarely, conditionally, and only
 * while a weather pane shows a place. No test here reaches a real weather service.
 */

const fixture = (name: string) =>
  readFileSync(new URL(`../unit/fixtures/${name}`, import.meta.url), 'utf8')

const jmaForecast = fixture('jma-forecast-130000.json')
const metForecast = fixture('met-london.json')
const areaList = JSON.stringify({
  centers: {},
  offices: {
    '130000': { name: '東京都', enName: 'Tokyo', officeName: '気象庁', children: [] },
    '270000': { name: '大阪府', enName: 'Osaka', officeName: '大阪管区気象台', children: [] },
  },
})

let server: Server
let origin: string
const requests: Array<{ url: string; headers: Record<string, string | string[] | undefined> }> = []

type Reply = { status: number; body?: string; headers?: Record<string, string> }

const ok = (body: string, headers: Record<string, string> = {}): Reply => ({
  status: 200,
  body,
  headers,
})

function nwsPoint(): string {
  // The NWS point names its forecast URLs, which must stay on the same server.
  const point = JSON.parse(fixture('nws-point-nyc.json'))
  point.properties.forecast = `${origin}/nws/gridpoints/OKX/33,42/forecast`
  point.properties.forecastHourly = `${origin}/nws/gridpoints/OKX/33,42/forecast/hourly`
  return JSON.stringify(point)
}

function route(url: string, ifNoneMatch: string | undefined): Reply {
  if (url === '/bosai/common/const/area.json') return ok(areaList)
  if (/^\/bosai\/forecast\/data\/forecast\/\d{6}\.json$/.test(url)) {
    return ifNoneMatch === '"fixture"' ? { status: 304 } : ok(jmaForecast, { etag: '"fixture"' })
  }
  if (url.startsWith('/weatherapi/locationforecast/2.0/complete?')) {
    return ok(metForecast, {
      expires: new Date(Date.now() + 3_600_000).toUTCString(),
      'last-modified': new Date().toUTCString(),
    })
  }
  if (url.startsWith('/nws/points/')) return ok(nwsPoint())
  if (url.endsWith('/forecast/hourly')) return ok(fixture('nws-hourly-nyc.json'))
  if (url.endsWith('/forecast')) return ok(fixture('nws-forecast-nyc.json'))
  return { status: 404 }
}

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const url = req.url ?? ''
    requests.push({ url, headers: req.headers })
    const header = req.headers['if-none-match']
    const reply = route(url, typeof header === 'string' ? header : undefined)
    res
      .writeHead(reply.status, { 'content-type': 'application/json', ...reply.headers })
      .end(reply.body)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
})

test.beforeEach(() => {
  requests.length = 0
})

const weatherOnly = (state?: Record<string, unknown>) => ({
  version: 1,
  root: { kind: 'pane', id: 'w', widget: 'weather', ...(state ? { state } : {}) },
})
const TOKYO = { location: { source: 'jma', office: '130000', name: '東京都' } }

const services = () => ({
  jmaBaseUrl: `${origin}/bosai`,
  env: { ELECDEX_MET_BASE_URL: `${origin}/weatherapi`, ELECDEX_NWS_BASE_URL: `${origin}/nws` },
})

const watching = (page: Page) => page.evaluate(() => window.elecdex.weather.watching())
const pane = (page: Page) => page.locator('[data-testid=pane][data-widget=weather]')

test('the default is New York from the National Weather Service, in °F', async () => {
  const { page, close } = await launch(undefined, { layout: weatherOnly(), ...services() })
  try {
    const p = pane(page)
    await expect(p.getByTestId('weather-now')).toHaveText(/^\d+°$/, { timeout: 20_000 })
    await expect(p.getByTestId('weather')).toHaveAttribute('data-source', 'nws')
    await expect(p.getByTestId('pane-subtitle')).toContainText('New York City')
    await expect(p.getByTestId('weather-telop')).toHaveText('Showers And Thunderstorms')
    await expect(p.getByTestId('weather-attribution')).toHaveText(/National Weather Service/)
    // 79°F in the fixture.
    await expect(p.getByTestId('weather-today')).toContainText('79°')
    // The forecast rises in: today, then the week a day at a time.
    const rise = (el: Element) => {
      const s = getComputedStyle(el)
      return `${s.animationName} ${s.animationDelay}`
    }
    await expect.poll(() => p.getByTestId('weather-today').evaluate(rise)).toBe('fx-rise 0s')
    const days = p.getByTestId('weather-day')
    expect(await days.first().evaluate(rise)).toBe('fx-rise 0.045s')
    expect(await days.nth(5).evaluate(rise)).toBe('fx-rise 0.27s')

    const nws = requests.filter((r) => r.url.startsWith('/nws/'))
    expect(nws.map((r) => r.url.replace(/\?.*/, ''))).toEqual([
      '/nws/points/40.7143,-74.006',
      '/nws/gridpoints/OKX/33,42/forecast',
      '/nws/gridpoints/OKX/33,42/forecast/hourly',
    ])
    expect(String(nws[0]?.headers['user-agent'])).toMatch(
      /^elecdex\/.*github\.com\/kurouna\/elecdex/,
    )

    // The unit switch converts, and is remembered.
    await p.getByTestId('weather-settings-toggle').click()
    await p.locator('[data-testid=weather-unit][data-unit=c]').click()
    await expect(p.getByTestId('weather-today')).toContainText('26°')
  } finally {
    await close()
  }
})

test("the forecast opens the source's page for the place", async () => {
  const { page, app, close } = await launch(undefined, { layout: weatherOnly(), ...services() })
  try {
    const p = pane(page)
    await expect(p.getByTestId('weather-now')).toHaveText(/^\d+°$/, { timeout: 20_000 })
    await app.evaluate(({ shell }) => {
      const opened: string[] = []
      ;(globalThis as { __opened?: string[] }).__opened = opened
      shell.openExternal = async (url: string) => {
        opened.push(url)
      }
    })
    const url = 'https://forecast.weather.gov/MapClick.php?lat=40.7143&lon=-74.006'
    // Today and any day of the week lead to the same page, through main.
    await p.getByTestId('weather-open').click()
    await p.getByTestId('weather-day').nth(2).click()
    await expect
      .poll(() => app.evaluate(() => (globalThis as { __opened?: string[] }).__opened))
      .toEqual([url, url])
  } finally {
    await close()
  }
})

test('a place chosen in the picker is forecast by MET Norway, within its terms', async () => {
  const { page, close } = await launch(undefined, { layout: weatherOnly(), ...services() })
  try {
    const p = pane(page)
    await p.getByTestId('weather-settings-toggle').click()
    await p.getByTestId('weather-location').click()
    const picker = page.getByTestId('location-picker')
    await expect(picker).toBeVisible()
    await page.getByTestId('location-filter').fill('london')
    await expect(picker.getByTestId('location-choice').first()).toContainText('London')
    await expect(picker.getByTestId('location-choice').first()).toHaveAttribute(
      'data-source',
      'met',
    )
    await page.keyboard.press('Enter')
    await expect(picker).toHaveCount(0)

    await expect(p.getByTestId('weather')).toHaveAttribute('data-source', 'met')
    await expect(p.getByTestId('weather-day').first()).toBeVisible({ timeout: 20_000 })
    await expect(p.getByTestId('weather-attribution')).toHaveText(/MET Norway.*CC BY 4\.0/)
    await expect.poll(() => watching(page)).toEqual(['met:51.5085,-0.1257:Europe/London'])

    const met = requests.filter((r) => r.url.startsWith('/weatherapi/'))
    expect(met).toHaveLength(1)
    // Four decimals at most, as MET Norway requires.
    expect(met[0]?.url).toMatch(/lat=51\.5085&lon=-0\.1257$/)
    expect(String(met[0]?.headers['user-agent'])).toMatch(/github\.com\/kurouna\/elecdex/)
    // And New York is no longer fetched.
    expect(await watching(page)).not.toContain('nws:40.7143,-74.006:America/New_York')
  } finally {
    await close()
  }
})

test('a Japanese city is forecast by JMA, and the area can be chosen', async () => {
  const { page, userData, close } = await launch(undefined, {
    layout: weatherOnly(),
    ...services(),
  })
  try {
    const p = pane(page)
    await p.getByTestId('weather-settings-toggle').click()
    await p.getByTestId('weather-location').click()
    await page.getByTestId('location-filter').fill('yokohama')
    await expect(page.getByTestId('location-choice').first()).toHaveAttribute('data-source', 'jma')
    await page.getByTestId('location-choice').first().click()

    await expect.poll(() => watching(page), { timeout: 10_000 }).toEqual(['jma:140000'])
    await expect(p.getByTestId('weather-telop')).toBeVisible({ timeout: 20_000 })
    await expect(p.getByTestId('weather-attribution')).toHaveText(
      '出典：気象庁ホームページ（https://www.jma.go.jp/bosai/forecast/）を加工して作成',
    )

    // The fixture is Tokyo's; its areas are offered all the same.
    await p.getByTestId('weather-area').selectOption('130040')
    // The title puts the chosen place in front of the area; the place button shows
    // the place alone, as the area is chosen beside it.
    await expect(p.getByTestId('pane-subtitle')).toContainText('Yokohama 小笠原諸島')
    await expect(p.getByTestId('weather-location')).toHaveText('Yokohama · change…')
    await expect
      .poll(() => readFileSync(`${userData}/layout.json`, 'utf8'), { timeout: 10_000 })
      .toMatch(/"area":\s*"130040"/)
  } finally {
    await close()
  }
})

test('JMA: one request, and a restart reuses the saved forecast', async () => {
  const first = await launch(undefined, { layout: weatherOnly(TOKYO), ...services() })
  await expect(pane(first.page).getByTestId('weather-telop')).toHaveText(
    'くもり夕方から晴れ所により昼過ぎまで雨',
    { timeout: 20_000 },
  )
  await expect(pane(first.page).getByTestId('pane-subtitle')).toHaveText(
    '東京都 東京地方 · 11:00 発表',
  )
  await first.page.waitForTimeout(1500)
  expect(requests.filter((r) => r.url.includes('/forecast/data/'))).toHaveLength(1)
  await first.quit()

  requests.length = 0
  const second = await launch(first.userData, services())
  try {
    await expect(pane(second.page).getByTestId('weather-telop')).toBeVisible({ timeout: 10_000 })
    await second.page.waitForTimeout(1500)
    // Either no request, or a conditional one answered 304 - never a fresh download.
    for (const r of requests.filter((r) => r.url.includes('/forecast/data/'))) {
      expect(r.headers['if-none-match']).toBe('"fixture"')
    }
  } finally {
    await second.close()
  }
})

test('in a short pane the week gives way, and the credit stays whole', async () => {
  // Short enough that the forecast cannot all fit: the credit must not be squeezed.
  const layout = {
    version: 1,
    root: {
      kind: 'split',
      id: 's',
      direction: 'column',
      sizes: [0.2, 0.8],
      children: [
        { kind: 'pane', id: 'w', widget: 'weather', state: TOKYO },
        { kind: 'pane', id: 'c', widget: 'clock' },
      ],
    },
  }
  const { page, close } = await launch(undefined, { layout, ...services() })
  try {
    const credit = pane(page).getByTestId('weather-attribution')
    await expect(pane(page).getByTestId('weather-day').first()).toBeVisible({ timeout: 20_000 })
    const size = await credit.evaluate((el) => ({ box: el.clientHeight, content: el.scrollHeight }))
    expect(size.box).toBeGreaterThan(0)
    expect(size.box).toBeGreaterThanOrEqual(size.content)
  } finally {
    await close()
  }
})

test('an old pane that saved a JMA office still shows it', async () => {
  const { page, close } = await launch(undefined, {
    layout: weatherOnly({ office: '270000' }),
    ...services(),
  })
  try {
    await expect.poll(() => watching(page), { timeout: 10_000 }).toEqual(['jma:270000'])
    // It has no saved name, so the office code is never shown in front of the area.
    await expect(pane(page).getByTestId('pane-subtitle')).toHaveText('東京地方 · 11:00 発表', {
      timeout: 20_000,
    })
  } finally {
    await close()
  }
})

test('stops fetching when the weather pane is removed', async () => {
  const { page, close } = await launch(undefined, { layout: weatherOnly(), ...services() })
  try {
    await expect.poll(() => watching(page), { timeout: 20_000 }).toHaveLength(1)
    await page.waitForTimeout(1500)
    await page.evaluate((tree) => window.elecdex.layout.save(tree), {
      version: 1,
      root: { kind: 'pane', id: 't', widget: 'terminal' },
    } as const)
    await page.reload()
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
    await expect.poll(() => watching(page), { timeout: 10_000 }).toEqual([])
  } finally {
    await close()
  }
})

test('an unreachable service shows the error, not a blank pane', async () => {
  const { page, close } = await launch(undefined, { layout: weatherOnly() })
  try {
    const p = pane(page)
    await expect(p.getByTestId('weather-status')).toContainText('forecast unavailable', {
      timeout: 30_000,
    })
    await expect(p.getByTestId('pane-badge')).toHaveText('offline')
    await expect(p.getByTestId('weather-attribution')).toBeVisible()
  } finally {
    await close()
  }
})

test('the week forecast can be turned off in the pane settings, keeping the credit at the bottom, and stays off', async () => {
  let launched = await launch(undefined, { layout: weatherOnly(TOKYO), ...services() })
  try {
    let p = pane(launched.page)
    await expect(p.getByTestId('weather-day').first()).toBeVisible({ timeout: 20_000 })
    await p.getByTestId('weather-settings-toggle').click()
    const toggle = p.getByTestId('weather-week-toggle')
    // On by default.
    await expect(toggle).toBeChecked()
    await toggle.uncheck()
    await expect(p.getByTestId('weather-week')).toHaveCount(0)
    await expect(p.getByTestId('weather-today')).toBeVisible()

    // Nothing fills the height now: the credit still sits at the bottom of the pane.
    const gap = await p.evaluate((el) => {
      const body = el.querySelector('[data-testid=weather]')?.getBoundingClientRect()
      const credit = el.querySelector('[data-testid=weather-attribution]')?.getBoundingClientRect()
      return body && credit ? body.bottom - credit.bottom : Number.NaN
    })
    expect(gap).toBeGreaterThanOrEqual(0)
    expect(gap).toBeLessThan(4)

    // Kept in the pane's state: still off after a restart.
    await launched.page.waitForTimeout(1500) // let the layout save
    launched = await launched.relaunch()
    p = pane(launched.page)
    await expect(p.getByTestId('weather-today')).toBeVisible({ timeout: 20_000 })
    await expect(p.getByTestId('weather-week')).toHaveCount(0)
    await p.getByTestId('weather-settings-toggle').click()
    await p.getByTestId('weather-week-toggle').check()
    await expect(p.getByTestId('weather-day').first()).toBeVisible()
  } finally {
    await launched.close()
  }
})

test('the place picker scrolls to the row the arrow keys choose', async () => {
  const { app, page, close } = await launch(undefined, { layout: weatherOnly(), ...services() })
  try {
    // A window short enough that the matches cannot all show at once.
    const window = await app.browserWindow(page)
    await window.evaluate((w) => {
      w.setFullScreen(false)
      w.setSize(1100, 560)
    })

    const p = pane(page)
    await p.getByTestId('weather-settings-toggle').click()
    await p.getByTestId('weather-location').click()
    await expect(page.getByTestId('location-picker')).toBeVisible()
    // "san" matches far more cities than the list can show.
    await page.getByTestId('location-filter').fill('san')
    const list = '[data-testid=location-picker] [role=listbox]'
    const count = await page.getByTestId('location-choice').count()
    expect(count).toBeGreaterThan(8)
    expect((await selectedRow(page, list))?.scrollable).toBe(true)

    for (let i = 1; i < count; i++) await page.keyboard.press('ArrowDown', { delay: 10 })
    await expect
      .poll(() => selectedRow(page, list))
      .toEqual({ index: count - 1, scrollable: true, inView: true })

    // Wrapping round the ends shows the row it lands on.
    await page.keyboard.press('ArrowDown')
    await expect
      .poll(() => selectedRow(page, list))
      .toEqual({ index: 0, scrollable: true, inView: true })
    await page.keyboard.press('ArrowUp')
    await expect
      .poll(() => selectedRow(page, list))
      .toEqual({ index: count - 1, scrollable: true, inView: true })
  } finally {
    await close()
  }
})
