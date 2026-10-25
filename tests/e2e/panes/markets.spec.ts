import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect } from '@playwright/test'
import { test } from '../support/shared.js'
import { atDesignSize, launch, quietFor, single, waitForSaved, watching } from '../support.js'

/**
 * The market board, served by a local stub; nothing here contacts Yahoo.
 */

const layout = (widget: string, state?: Record<string, unknown>) =>
  single(widget, state === undefined ? { id: 'p' } : { id: 'p', state })

/**
 * Waits until layout.json holds the one pane's state with every key of `want`: what a restart
 * must find, written by a debounced save the test cannot see.
 */
const paneStateSaved = (userData: string, want: Record<string, unknown>) =>
  waitForSaved(userData, (text) => {
    const state = (JSON.parse(text) as { root?: { state?: Record<string, unknown> } }).root?.state
    return Object.entries(want).every(
      ([key, value]) => JSON.stringify(state?.[key]) === JSON.stringify(value),
    )
  })

test.describe('markets', () => {
  let server: Server
  let stubUrl = ''
  let quoteRequests = 0
  const chartRequests: string[] = []

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
        const range = url.searchParams.get('range') ?? ''
        chartRequests.push(`${decodeURIComponent(url.pathname.slice(7))}|${range}`)
        const now = Date.now()
        if (range === '1d') {
          // The plain series the stub has always served, read as flat bars.
          const points = Array.from({ length: 30 }, (_, i) => ({
            t: now - (30 - i) * 60_000,
            v: 990 + i,
          }))
          res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(points))
          return
        }
        // Daily bars reaching back past the six-month window, all closing at 800.
        const day = 24 * 60 * 60_000
        const candles = Array.from({ length: 190 }, (_, i) => ({
          t: now - (189 - i) * day,
          o: 790,
          h: 830 + (i % 7),
          l: 770 - (i % 5),
          c: 800,
        }))
        res
          .writeHead(200, { 'content-type': 'application/json' })
          .end(JSON.stringify({ candles, previousClose: 700 }))
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
      layout: layout('markets', {
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

      // Two symbols, one batched request - not one per symbol. Nor one per click: another view
      // is a new pane state, and must not drop and take the subscriptions again.
      await quietFor(1500, async () => quoteRequests, 'the quote requests')
      expect(quoteRequests).toBe(1)
      expect(await watching(page, 'markets')).toEqual(['JPY=X', '^N225'])

      // Editing the list changes what main polls.
      await page.getByTestId('markets-settings-toggle').click()
      await page.getByTestId('markets-symbols').fill('^GSPC S&P 500')
      await page.getByTestId('markets-save').click()
      await expect.poll(() => watching(page, 'markets'), { timeout: 10_000 }).toEqual(['^GSPC'])
      await expect(page.getByTestId('market-bar')).toHaveCount(1)
      await expect(page.getByTestId('market-bar').first()).toContainText('S&P 500')
    } finally {
      await close()
    }
  })

  test('candles and a longer range: main keeps only the chosen chart, and both survive a restart', async () => {
    let launched = await launch(undefined, {
      // Saved before ranges existed: no range in the pane state.
      layout: layout('markets', { symbols: [{ symbol: '^N225', label: '日経平均' }] }),
      env: { ELECDEX_MARKETS_STUB_URL: stubUrl },
    })
    try {
      const { page } = launched
      const markets = page.getByTestId('markets')
      const charts = () => page.evaluate(() => window.elecdex.markets.charts())
      await expect(markets).toHaveAttribute('data-range', '1d')
      await expect(page.getByTestId('market-price')).toHaveText('1,000', { timeout: 20_000 })
      expect(await charts()).toEqual(['^N225|1d'])
      await expect(page.getByTestId('pane-subtitle')).toContainText('1D ·')

      await page.getByTestId('markets-view').locator('[data-view=candles]').click()
      await expect(markets).toHaveAttribute('data-view', 'candles')
      const candles = page.getByTestId('market-candles')
      await expect(candles).toHaveCount(1)
      await expect(candles).toHaveAttribute('data-bars', /^[1-9]\d*$/)
      await expect(page.getByTestId('market-spark')).toHaveCount(0)

      // The ranges stand above the board: one click, no settings panel.
      await page.getByTestId('markets-ranges').locator('[data-range="6mo"]').click()
      await expect(markets).toHaveAttribute('data-range', '6mo')
      await expect(page.getByTestId('markets-range')).toHaveText('1d')
      // The 1D chart is dropped as the 6M one is taken; the symbol is quoted once throughout.
      await expect.poll(charts, { timeout: 10_000 }).toEqual(['^N225|6mo'])
      expect(await watching(page, 'markets')).toEqual(['^N225'])
      await expect.poll(() => chartRequests.includes('^N225|6mo'), { timeout: 10_000 }).toBe(true)
      // Measured from the close before the six months (800), not the day's change.
      await expect(page.getByTestId('market-row')).toContainText('+25.00%', { timeout: 10_000 })
      await expect(page.getByTestId('pane-subtitle')).toContainText('6M ·')
      await expect(candles).toHaveAttribute('data-bars', /^[1-9]\d*$/)

      await page.getByTestId('markets-view').locator('[data-view=bars]').click()
      const bar = page.getByTestId('market-bar')
      await expect(bar).toHaveAttribute('data-pct', '25.00')
      await expect(bar).toHaveAttribute('title', /base 800.00 \(.+ close\) → 1,000/)

      await paneStateSaved(launched.userData, { range: '6mo', view: 'bars' })
      launched = await launched.relaunch()
      const again = launched.page
      await expect(again.getByTestId('markets')).toHaveAttribute('data-range', '6mo')
      await expect(again.getByTestId('markets')).toHaveAttribute('data-view', 'bars')
      await expect(again.getByTestId('market-bar')).toHaveAttribute('data-pct', '25.00', {
        timeout: 20_000,
      })
      expect(await again.evaluate(() => window.elecdex.markets.charts())).toEqual(['^N225|6mo'])
    } finally {
      await launched.close()
    }
  })

  test('the rows fill the pane: charts from the names to the figures, candles across the row', async () => {
    const { page, close } = await launch(undefined, {
      layout: layout('markets', { symbols: [{ symbol: '^N225' }, { symbol: 'JPY=X' }] }),
      env: { ELECDEX_MARKETS_STUB_URL: stubUrl },
    })
    try {
      const markets = page.getByTestId('markets')
      const measure = () =>
        page.locator('.board').evaluate((board) => {
          const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
          const box = (el: Element | null) => (el as Element).getBoundingClientRect()
          const rows = [...board.querySelectorAll('[data-testid=market-row]')]
          const first = rows[0] as Element
          return {
            rowWidth: box(first).width / rem,
            nameToChart: (box(first.querySelector('.chart')).left - box(first).left) / rem,
            chartWidth: box(first.querySelector('.chart')).width / rem,
            chartLefts: rows.map((r) => Math.round(box(r.querySelector('.chart')).left)),
            rowsHeight: rows.reduce((sum, r) => sum + box(r).height, 0),
            boardHeight: box(board).height,
          }
        })
      await expect(page.getByTestId('market-price').first()).toHaveText('1,000', {
        timeout: 20_000,
      })
      const line = await measure()
      // A wide pane: 28% of it would be far more than the names need.
      expect(line.rowWidth * 0.28).toBeGreaterThan(12)
      // The name column (at most 9rem), the padding and the gap.
      expect(line.nameToChart).toBeLessThan(10.5)
      // The names and the figures take what they need, and the chart has the rest.
      expect(line.chartWidth).toBeGreaterThan(line.rowWidth * 0.75)
      // One grid for the board: every chart starts on the same line.
      expect(new Set(line.chartLefts).size).toBe(1)
      // The rows share the whole height: no strip of empty pane under the last of them.
      expect(line.rowsHeight).toBeGreaterThan(line.boardHeight - 2)

      await page.getByTestId('markets-view').locator('[data-view=candles]').click()
      await expect(markets).toHaveAttribute('data-view', 'candles')
      const candles = await measure()
      // Under the name and the figures, not between them: the row's whole width.
      expect(candles.nameToChart).toBeLessThan(1)
      expect(candles.chartWidth).toBeGreaterThan(candles.rowWidth * 0.95)
      expect(candles.rowsHeight).toBeGreaterThan(candles.boardHeight - 2)

      // Back to lines, the rows are as they were.
      await page.getByTestId('markets-view').locator('[data-view=line]').click()
      expect((await measure()).nameToChart).toBeCloseTo(line.nameToChart, 1)
    } finally {
      await close()
    }
  })

  test('a wide pane stands the rows in two columns; the side pane packs them', async ({
    shared,
  }) => {
    // Wide: the markets pane alone, with the default eight symbols.
    const wide = await shared({ layout: layout('markets') })
    try {
      const board = wide.page.locator('.board')
      await expect(board).toHaveAttribute('data-columns', '2')
      const tops = await board.evaluate((el) =>
        [...el.querySelectorAll('[data-testid=market-row]')].map((r) =>
          Math.round(r.getBoundingClientRect().top),
        ),
      )
      // Eight rows on four lines, side by side in pairs.
      expect(tops).toHaveLength(8)
      expect(new Set(tops).size).toBe(4)
      expect(tops[0]).toBe(tops[1])
    } finally {
      await wide.close()
    }

    // The default layout's pane is short for eight rows: they are packed to one line each.
    const side = await shared()
    try {
      const pane = side.page.locator('[data-testid=pane][data-widget=markets]')
      const board = pane.locator('.board')
      await expect(board).toHaveAttribute('data-dense', 'true')
      await expect(board).toHaveAttribute('data-columns', '1')
      const first = pane.getByTestId('market-row').first()
      await expect(first.locator('.ticker')).toBeHidden()
      await expect(first.locator('.short')).toBeHidden() // nothing to show until a quote arrives
      const rem = await side.page.evaluate(() =>
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      )
      expect(((await first.boundingBox())?.height ?? 0) / rem).toBeLessThan(2.2)
    } finally {
      await side.close()
    }
  })

  test("the bar view's zero stands on the rows' axis, and the rows sort by the change", async () => {
    // The default pane's list scrolls: a scale as wide as the pane once stood beside the axis.
    const { app, page, close } = await launch(undefined, {
      env: { ELECDEX_MARKETS_STUB_URL: stubUrl },
    })
    try {
      // In the window the default layout is designed for: narrower than that, the
      // scale's own labels are wider than the column they share with the bars, and
      // what they overflow into is the widget's problem, not the axis's.
      await atDesignSize(app, page)
      const pane = page.locator('[data-testid=pane][data-widget=markets]')
      await pane.getByTestId('markets-view').locator('[data-view=bars]').click()
      await expect(pane.getByTestId('market-bar').first()).toHaveAttribute('data-pct', '1.25', {
        timeout: 20_000,
      })
      const centre = (el: Element) => {
        const box = el.getBoundingClientRect()
        return box.left + box.width / 2
      }
      const zero = await pane.locator('.ticks span').nth(1).evaluate(centre)
      const axis = await pane.locator('.axis').first().evaluate(centre)
      // The scale and the rows are two grids on the same columns, so they line up
      // only while they are the same width. What that is made of - each one's own
      // content box, and the gutter each reserves for a scrollbar - is measured
      // here, since a machine where they differ says nothing by the offset alone.
      const widths = await pane.evaluate((el) => {
        const of = (selector: string) => {
          const found = el.querySelector(selector)
          return found === null
            ? null
            : { client: found.clientWidth, box: Math.round(found.getBoundingClientRect().width) }
        }
        return { scale: of('.scale'), bars: of('.bars'), row: of('.bar-row .hit') }
      })
      expect(
        Math.abs(zero - axis),
        `zero ${zero} vs axis ${axis}; ${JSON.stringify(widths)}`,
      ).toBeLessThan(1.5)

      const order = () =>
        pane
          .getByTestId('market-bar')
          .evaluateAll((bars) => bars.map((b) => Number(b.getAttribute('data-pct'))))
      const listed = await order()
      await pane.getByTestId('markets-sort').click()
      await expect(pane.getByTestId('markets-sort')).toHaveAttribute('aria-pressed', 'true')
      const sorted = await order()
      expect(sorted).toEqual([...listed].sort((a, b) => b - a))
      expect(sorted).not.toEqual(listed)

      // Packed rows show the change as its percentage alone.
      await pane.getByTestId('markets-view').locator('[data-view=line]').click()
      const first = pane.getByTestId('market-row').first()
      await expect(first.locator('.short')).toBeVisible()
      await expect(first.locator('.full')).toBeHidden()
    } finally {
      await close()
    }
  })

  test('a row opens its chart over the whole pane, and the arrow goes back to the list', async () => {
    let launched = await launch(undefined, {
      layout: layout('markets', { symbols: [{ symbol: '^N225' }, { symbol: 'JPY=X' }] }),
      env: { ELECDEX_MARKETS_STUB_URL: stubUrl },
    })
    try {
      const { page } = launched
      const markets = page.getByTestId('markets')
      await expect(page.getByTestId('market-price').first()).toHaveText('1,000', {
        timeout: 20_000,
      })
      // The row is a button now; the market's state light must still be a dot, not
      // whatever the button's styles would make of it (they once shared a class).
      const dot = await page
        .locator('[data-testid=market-row] .state')
        .first()
        .evaluate((el) => el.getBoundingClientRect())
      expect(dot.width).toBeCloseTo(dot.height, 0)
      expect(dot.width).toBeLessThan(10)

      await page.getByTestId('market-row').nth(1).getByTestId('market-open').click()
      const detail = page.getByTestId('markets-detail')
      await expect(detail).toHaveAttribute('data-symbol', 'JPY=X')
      await expect(page.getByTestId('market-detail-price')).toHaveText('150.25')
      await expect(detail).toContainText('−0.80%')
      await expect(page.getByTestId('market-row')).toHaveCount(0)
      const chart = page.getByTestId('market-detail-chart')
      await expect(chart).toHaveAttribute('data-bars', /^[1-9]\d*$/)
      // The chart has the pane: everything under the head, down to the credit. Polled,
      // because it powers on like a tube and is drawn scaled until it has.
      const paneBox = await markets.boundingBox()
      const share = async () => {
        const box = await chart.boundingBox()
        return Math.min(
          (box?.width ?? 0) / (paneBox?.width ?? 1) / 0.95,
          (box?.height ?? 0) / (paneBox?.height ?? 1) / 0.8,
        )
      }
      // At least 95% of the pane's width and 80% of its height.
      await expect.poll(share).toBeGreaterThan(1)
      // Both symbols stay quoted, so the list is current when it comes back.
      expect(await watching(page, 'markets')).toEqual(['JPY=X', '^N225'])

      await page.getByTestId('markets-view').locator('[data-view=candles]').click()
      await expect(chart).toHaveAttribute('data-view', 'candles')
      await chart.hover({ position: { x: 40, y: 40 } })
      await expect(page.getByTestId('market-detail-readout')).toContainText(/O .+H .+L .+C /)

      // The range beside the chart is the pane's.
      await page.getByTestId('markets-ranges').locator('[data-range="6mo"]').click()
      await expect(markets).toHaveAttribute('data-range', '6mo')
      await expect(detail).toContainText('%', { timeout: 10_000 })

      // The open chart is pane state: it is there after a restart.
      await paneStateSaved(launched.userData, {
        focus: 'JPY=X',
        detailView: 'candles',
        range: '6mo',
      })
      launched = await launched.relaunch()
      const again = launched.page
      await expect(again.getByTestId('markets-detail')).toHaveAttribute('data-symbol', 'JPY=X')
      await expect(again.getByTestId('market-detail-chart')).toHaveAttribute('data-view', 'candles')

      await again.getByTestId('markets-back').click()
      await expect(again.getByTestId('markets-detail')).toHaveCount(0)
      await expect(again.getByTestId('market-row')).toHaveCount(2)
      // The board kept its own view: choosing candles for the chart did not change it.
      await expect(again.getByTestId('markets')).toHaveAttribute('data-view', 'line')
      await expect(again.getByTestId('market-spark')).toHaveCount(2)
    } finally {
      await launched.close()
    }
  })

  test('a watchlist longer than the pane scrolls in both views instead of covering the credit', async ({
    shared,
  }) => {
    // The default layout's markets pane is short and its watchlist has eight symbols.
    const { page, close } = await shared()
    try {
      const pane = page.locator('[data-testid=pane][data-widget=markets]')
      const credit = pane.locator('.credit')
      for (const [view, list] of [
        ['line', '.board'],
        ['candles', '.board'],
        ['bars', '[data-testid=markets-bars]'],
      ] as const) {
        await pane.getByTestId('markets-view').locator(`[data-view=${view}]`).click()
        const geometry = await pane.locator(list).evaluate(
          (el, creditEl) => {
            const box = el.getBoundingClientRect()
            return {
              overflows: el.scrollHeight > el.clientHeight,
              scrolls: getComputedStyle(el).overflowY === 'auto',
              bottom: box.bottom,
              creditTop: (creditEl as Element).getBoundingClientRect().top,
            }
          },
          await credit.elementHandle(),
        )
        expect(geometry.overflows, view).toBe(true)
        expect(geometry.scrolls, view).toBe(true)
        // The list ends above the credit, so nothing is drawn over it.
        expect(geometry.bottom, view).toBeLessThanOrEqual(geometry.creditTop + 1)
      }
      // Scrolled to the end, the last symbol is reachable in the bar view.
      const bars = pane.getByTestId('markets-bars')
      await bars.evaluate((el) => {
        el.scrollTop = el.scrollHeight
      })
      const last = pane.getByTestId('market-bar').last()
      const lastBox = await last.boundingBox()
      const barsBox = await bars.boundingBox()
      expect((lastBox?.y ?? 0) + (lastBox?.height ?? 0)).toBeLessThanOrEqual(
        (barsBox?.y ?? 0) + (barsBox?.height ?? 0) + 1,
      )
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
        layout: layout('markets', { symbols }),
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

  test('an unreachable source shows the problem instead of numbers', async ({ shared }) => {
    const { page, close } = await shared({ layout: layout('markets') })
    try {
      await expect(page.getByTestId('pane-badge')).toHaveText('stale', { timeout: 20_000 })
      await expect(page.getByTestId('market-row').first()).toContainText(/fetch failed|HTTP|ECONN/i)
    } finally {
      await close()
    }
  })
})
