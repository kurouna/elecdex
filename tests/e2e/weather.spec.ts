import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The weather widget, against a local stand-in for JMA.
 *
 * The server serves a real forecast captured from JMA and a trimmed area list,
 * and counts requests - the point being that the app asks rarely, conditionally,
 * and only while a weather pane exists. No test here reaches the real site.
 */

const forecast = readFileSync(
  new URL('../unit/fixtures/jma-forecast-130000.json', import.meta.url),
  'utf8',
)
const areaList = JSON.stringify({
  centers: {},
  offices: {
    '130000': { name: '東京都', enName: 'Tokyo', officeName: '気象庁', children: [] },
    '270000': { name: '大阪府', enName: 'Osaka', officeName: '大阪管区気象台', children: [] },
  },
})

let server: Server
let baseUrl: string
const requests: Array<{ url: string; ifNoneMatch: string | undefined }> = []

test.beforeAll(async () => {
  server = createServer((req, res) => {
    requests.push({ url: req.url ?? '', ifNoneMatch: req.headers['if-none-match'] })
    if (req.url === '/bosai/common/const/area.json') {
      res.writeHead(200, { 'content-type': 'application/json' }).end(areaList)
    } else if (/^\/bosai\/forecast\/data\/forecast\/\d{6}\.json$/.test(req.url ?? '')) {
      if (req.headers['if-none-match'] === '"fixture"') res.writeHead(304).end()
      else
        res.writeHead(200, { 'content-type': 'application/json', etag: '"fixture"' }).end(forecast)
    } else {
      res.writeHead(404).end()
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/bosai`
})

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
})

test.beforeEach(() => {
  requests.length = 0
})

const WEATHER_ONLY = { version: 1, root: { kind: 'pane', id: 'w', widget: 'weather' } } as const

test('shows the forecast with JMA attribution, from a single request', async () => {
  const { page, close } = await launch(undefined, { jmaBaseUrl: baseUrl })
  try {
    const pane = page.locator('[data-testid=pane][data-widget=weather]')
    await expect(pane.getByTestId('weather-telop')).toHaveText(
      'くもり夕方から晴れ所により昼過ぎまで雨',
      { timeout: 20_000 },
    )
    await expect(pane.getByTestId('pane-subtitle')).toHaveText('東京地方 · 11:00 発表')
    await expect(pane.getByTestId('weather-day')).toHaveCount(6)
    await expect(pane.getByTestId('weather-attribution')).toHaveText(
      '出典：気象庁ホームページ（https://www.jma.go.jp/bosai/forecast/）を加工して作成',
    )

    expect(await page.evaluate(() => window.elecdex.weather.watching())).toEqual(['130000'])
    await page.waitForTimeout(2000)
    expect(requests.filter((r) => r.url.includes('/forecast/'))).toHaveLength(1)
  } finally {
    await close()
  }
})

test('stops fetching when the weather pane is removed', async () => {
  const { page, close } = await launch(undefined, { jmaBaseUrl: baseUrl })
  try {
    await expect
      .poll(() => page.evaluate(() => window.elecdex.weather.watching()), { timeout: 20_000 })
      .toEqual(['130000'])

    // Let the page's own debounced save (the terminal recording its session)
    // land first, or it would overwrite the layout this test writes.
    await page.waitForTimeout(2000)
    await page.evaluate((tree) => window.elecdex.layout.save(tree), {
      version: 1,
      root: { kind: 'pane', id: 't', widget: 'terminal' },
    } as const)
    await page.reload()
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
    await expect
      .poll(() => page.evaluate(() => window.elecdex.weather.watching()), { timeout: 10_000 })
      .toEqual([])
  } finally {
    await close()
  }
})

test('a restart reuses the saved forecast instead of downloading it again', async () => {
  const first = await launch(undefined, { jmaBaseUrl: baseUrl })
  await first.page.evaluate((tree) => window.elecdex.layout.save(tree), WEATHER_ONLY)
  await first.page.reload()
  await expect(first.page.getByTestId('weather-telop')).toBeVisible({ timeout: 20_000 })
  await first.app.close()

  requests.length = 0
  const second = await launch(first.userData, { jmaBaseUrl: baseUrl })
  try {
    // Shown at once, from disk.
    await expect(second.page.getByTestId('weather-telop')).toBeVisible({ timeout: 10_000 })
    await second.page.waitForTimeout(1500)
    // Either no request, or a conditional one answered 304 - never a fresh download.
    for (const r of requests.filter((r) => r.url.includes('/forecast/'))) {
      expect(r.ifNoneMatch).toBe('"fixture"')
    }
  } finally {
    await second.close()
  }
})

test('the office and area can be changed and are saved with the layout', async () => {
  const { page, userData, close } = await launch(undefined, { jmaBaseUrl: baseUrl })
  try {
    await page.evaluate((tree) => window.elecdex.layout.save(tree), WEATHER_ONLY)
    await page.reload()
    const pane = page.locator('[data-testid=pane][data-widget=weather]')
    await expect(pane.getByTestId('weather-telop')).toBeVisible({ timeout: 20_000 })

    await pane.getByTestId('weather-settings-toggle').click()
    await expect(pane.getByTestId('weather-office').locator('option')).toHaveCount(2, {
      timeout: 10_000,
    })
    await pane.getByTestId('weather-area').selectOption('130040')
    await expect(pane.getByTestId('pane-subtitle')).toContainText('小笠原諸島')

    await pane.getByTestId('weather-office').selectOption('270000')
    await expect
      .poll(() => page.evaluate(() => window.elecdex.weather.watching()), { timeout: 10_000 })
      .toEqual(['270000'])

    await expect
      .poll(() => readFileSync(`${userData}/layout.json`, 'utf8'), { timeout: 10_000 })
      .toMatch(/"office":\s*"270000"/)
  } finally {
    await close()
  }
})

test('an unreachable server shows the error, not a blank pane', async () => {
  const { page, close } = await launch()
  try {
    await page.evaluate((tree) => window.elecdex.layout.save(tree), WEATHER_ONLY)
    await page.reload()
    const pane = page.locator('[data-testid=pane][data-widget=weather]')
    await expect(pane.getByTestId('weather-status')).toContainText('forecast unavailable', {
      timeout: 30_000,
    })
    await expect(pane.getByTestId('pane-badge')).toHaveText('offline')
    await expect(pane.getByTestId('weather-attribution')).toBeVisible()
  } finally {
    await close()
  }
})
