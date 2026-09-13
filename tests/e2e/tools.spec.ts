import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The CPU bar view, the application launcher and the market board.
 * Markets are served by a local stub; nothing here contacts Yahoo.
 */

const single = (widget: string, state?: Record<string, unknown>) => ({
  version: 1,
  root: { kind: 'pane', id: 'p', widget, ...(state ? { state } : {}) },
})

test('the CPU pane switches to a bar per core, and remembers it', async () => {
  let launched = await launch(undefined, { layout: single('cpu') })
  try {
    const { page } = launched
    const cpu = page.getByTestId('cpu')
    await expect(cpu).toHaveAttribute('data-view', 'line')
    await page.getByTestId('cpu-view').locator('[data-view=bars]').click()
    await expect(cpu).toHaveAttribute('data-view', 'bars')
    const cores = page.getByTestId('cpu-core')
    await expect.poll(() => cores.count(), { timeout: 20_000 }).toBeGreaterThan(0)
    const load = Number(await cores.first().getAttribute('data-load'))
    expect(load).toBeGreaterThanOrEqual(0)
    expect(load).toBeLessThanOrEqual(100)

    await page.waitForTimeout(1500) // let the layout save
    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('cpu')).toHaveAttribute('data-view', 'bars')
  } finally {
    await launched.close()
  }
})

test('the launcher lists user entries first and reports a launch that fails', async () => {
  const { page, close } = await launch(undefined, {
    layout: single('launcher'),
    settings: {
      sound: { enabled: false },
      launcher: {
        showSystem: false,
        items: [
          { name: 'Missing Tool', target: '/definitely/not/here/elecdex-e2e-missing' },
          { name: 'Another', target: '/also/not/here' },
        ],
      },
    },
  })
  try {
    const entries = page.getByTestId('launcher-entry')
    await expect(entries).toHaveCount(2)
    await expect(entries.first()).toHaveAttribute('data-source', 'user')
    await expect(entries.first()).toContainText('Missing Tool')

    await page.getByTestId('launcher-filter').fill('anoth')
    await expect(entries).toHaveCount(1)
    await page.getByTestId('launcher-filter').fill('missing')
    await page.getByTestId('launcher-filter').press('Enter')
    await expect(page.getByTestId('launcher-status')).toContainText(/missing tool/i)

    // The renderer can only launch what the list holds.
    const refused = await page.evaluate(() => window.elecdex.launcher.launch('not-an-id'))
    expect(refused).toEqual({ ok: false, error: 'not in the launcher' })
  } finally {
    await close()
  }
})

test('the launcher counts launches and lists the most used first', async () => {
  // Node itself, exiting at once: a program that really starts, on every platform.
  // The comment in the script keeps the two entries' ids apart.
  const quick = (name: string) => ({
    name,
    target: process.execPath,
    args: ['-e', `// ${name}`],
  })
  let launched = await launch(undefined, {
    layout: single('launcher'),
    settings: {
      sound: { enabled: false },
      launcher: { showSystem: false, items: [quick('Alpha'), quick('Bravo')] },
    },
  })
  try {
    const entries = launched.page.getByTestId('launcher-entry')
    await expect(entries).toHaveCount(2)
    await expect(entries.first()).toContainText('Alpha')

    const bravo = entries.filter({ hasText: 'Bravo' })
    await bravo.click()
    await expect(launched.page.getByTestId('launcher-status')).toContainText(/started bravo/i)
    // Reordered at once, and counted.
    await expect(entries.first()).toContainText('Bravo')
    await expect(entries.first()).toHaveAttribute('data-launches', '1')
    await expect(entries.nth(1)).toHaveAttribute('data-launches', '0')

    // The count survives a restart.
    launched = await launched.relaunch()
    const again = launched.page.getByTestId('launcher-entry')
    await expect(again.first()).toContainText('Bravo')
    await expect(again.first()).toHaveAttribute('data-launches', '1')
  } finally {
    await launched.close()
  }
})

test('the launcher lists the platform applications, with icons in the theme colour', async () => {
  const { page, close } = await launch(undefined, { layout: single('launcher') })
  try {
    await expect
      .poll(() => page.getByTestId('launcher-entry').count(), { timeout: 20_000 })
      .toBeGreaterThan(0)
    // An icon is tinted: masked by its own shape over the accent colour.
    const icon = page.getByTestId('launcher-icon').first()
    await expect(icon).toBeVisible({ timeout: 20_000 })
    const style = await icon.evaluate((el) => {
      const s = getComputedStyle(el)
      return { mask: s.maskImage || s.webkitMaskImage, background: s.backgroundColor }
    })
    expect(style.mask).toMatch(/^url\(/)
    expect(style.background).not.toBe('rgba(0, 0, 0, 0)')
  } finally {
    await close()
  }
})

test('the calendar shows this month with today marked, and pages through months', async () => {
  const { page, close } = await launch(undefined, { layout: single('calendar') })
  try {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const days = page.getByTestId('calendar-day')
    await expect(days).toHaveCount(42)
    await expect(page.locator('[data-testid=calendar-day][data-today]')).toHaveAttribute(
      'data-date',
      iso(now),
    )
    await expect(page.getByTestId('pane-subtitle')).toContainText(/week \d+/)

    const title = await page.getByTestId('calendar-title').textContent()
    await page.getByTestId('calendar-next').click()
    await expect(page.getByTestId('calendar-title')).not.toHaveText(title ?? '')
    await page.getByTestId('calendar-today').click()
    await expect(page.getByTestId('calendar-title')).toHaveText(title ?? '')

    // In Japan's time zone or in Japanese, holidays are marked: 1 January always is one.
    if ((await page.getByTestId('calendar').getAttribute('data-holidays')) === 'jp') {
      for (let i = 0; i < 12 && (await page.locator('[data-date$="-01-01"]').count()) === 0; i++) {
        await page.getByTestId('calendar-next').click()
      }
      await expect(page.locator('[data-date$="-01-01"]').first()).toHaveAttribute(
        'data-holiday',
        /.+/,
      )
      await expect(page.getByTestId('calendar-next-holiday')).not.toBeEmpty()
    }
  } finally {
    await close()
  }
})

test.describe('markets', () => {
  let server: Server
  let stubUrl = ''
  let quoteRequests = 0

  test.beforeAll(async () => {
    server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://stub')
      if (url.pathname === '/quotes') {
        quoteRequests += 1
        const symbols = (url.searchParams.get('symbols') ?? '').split(',')
        // By symbol, not position: main sends the symbols sorted.
        const quotes = symbols.map((symbol) => ({
          symbol,
          name: `${symbol} name`,
          price: symbol === 'JPY=X' ? 150.25 : 1000,
          change: symbol === 'JPY=X' ? -1.2 : 12.5,
          changePercent: symbol === 'JPY=X' ? -0.8 : 1.25,
          previousClose: 990,
          currency: 'JPY',
          state: 'open',
          time: Date.now(),
        }))
        res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(quotes))
      } else if (url.pathname.startsWith('/chart/')) {
        const now = Date.now()
        const points = Array.from({ length: 30 }, (_, i) => ({
          t: now - (30 - i) * 60_000,
          v: 990 + i,
        }))
        res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(points))
      } else {
        res.writeHead(404).end()
      }
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    stubUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  test.afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
  })

  test('the board shows prices and sparklines, then bars, from one request for all symbols', async () => {
    const { page, close } = await launch(undefined, {
      layout: single('markets', {
        symbols: [
          { symbol: '^N225', label: '日経平均' },
          { symbol: 'JPY=X', label: 'ドル円' },
        ],
      }),
      env: { ELECDEX_MARKETS_STUB_URL: stubUrl },
    })
    try {
      const rows = page.getByTestId('market-row')
      await expect(rows).toHaveCount(2)
      await expect(rows.first()).toContainText('日経平均')
      await expect(rows.first().getByTestId('market-price')).toHaveText('1,000', {
        timeout: 20_000,
      })
      await expect(rows.first()).toContainText('+1.25%')
      await expect(rows.first()).toHaveClass(/\bup\b/)
      await expect(rows.nth(1)).toHaveClass(/\bdown\b/)
      await expect(rows.first().getByTestId('market-spark')).toHaveAttribute('data-points', /\d\d/)
      await expect(page.getByTestId('markets')).toContainText('not investment advice')

      await page.getByTestId('markets-view').locator('[data-view=bars]').click()
      await expect(page.getByTestId('market-bar').first()).toHaveAttribute('data-pct', '1.25')
      await expect(page.getByTestId('market-bar').nth(1)).toHaveAttribute('data-pct', '-0.80')

      // Two symbols, one batched request - not one per symbol.
      expect(quoteRequests).toBe(1)
      expect(await page.evaluate(() => window.elecdex.markets.watching())).toEqual([
        'JPY=X',
        '^N225',
      ])

      // Editing the list changes what main polls.
      await page.getByTestId('markets-edit').click()
      await page.getByTestId('markets-symbols').fill('^GSPC S&P 500')
      await page.getByTestId('markets-save').click()
      await expect
        .poll(() => page.evaluate(() => window.elecdex.markets.watching()), { timeout: 10_000 })
        .toEqual(['^GSPC'])
      await expect(page.getByTestId('market-bar')).toHaveCount(1)
      await expect(page.getByTestId('market-bar').first()).toContainText('S&P 500')
    } finally {
      await close()
    }
  })

  test('built-in names follow the app language; labels the user typed do not', async () => {
    const symbols = [{ symbol: '^N225' }, { symbol: 'JPY=X', label: 'my yen' }]
    for (const [lang, nikkei] of [
      ['en-US', 'Nikkei 225'],
      ['ja', '日経平均'],
    ] as const) {
      const { page, close } = await launch(undefined, {
        layout: single('markets', { symbols }),
        args: [`--lang=${lang}`],
      })
      try {
        const rows = page.getByTestId('market-row')
        await expect(rows.first()).toContainText(nikkei)
        await expect(rows.nth(1)).toContainText('my yen')
      } finally {
        await close()
      }
    }
  })

  test('an unreachable source shows the problem instead of numbers', async () => {
    const { page, close } = await launch(undefined, { layout: single('markets') })
    try {
      await expect(page.getByTestId('pane-badge')).toHaveText('stale', { timeout: 20_000 })
      await expect(page.getByTestId('market-row').first()).toContainText(/fetch failed|HTTP|ECONN/i)
    } finally {
      await close()
    }
  })
})
