import { execFileSync } from 'node:child_process'
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
    // This wait has timed out now and then on CI (Linux and Windows) and never locally;
    // on a timeout, report what the collector was doing so the cause can be found.
    await expect
      .poll(() => cores.count(), { timeout: 20_000 })
      .toBeGreaterThan(0)
      .catch(async (error: Error) => {
        const stats = await page.evaluate(() => window.elecdex.metrics.stats()).catch(() => null)
        throw new Error(`${error.message}\nmetrics collector: ${JSON.stringify(stats)}`)
      })
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
    // It blinks where it was clicked, and only then moves up.
    await expect(bravo).toHaveClass(/blinking/)
    await expect(entries.first()).toContainText('Alpha')
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

test('a shortcut puts the cursor in the launcher search, adding the pane when there is none', async () => {
  const { page, close } = await launch(undefined, {
    layout: { version: 1, root: { kind: 'pane', id: 't', widget: 'terminal' } },
    settings: { sound: { enabled: false }, launcher: { showSystem: false, items: [] } },
  })
  try {
    await expect(page.getByTestId('launcher-filter')).toHaveCount(0)
    await page.keyboard.press('Control+Shift+KeyL')
    const filter = page.getByTestId('launcher-filter')
    await expect(filter).toBeFocused()

    await page.keyboard.type('abc')
    await page.locator('[data-testid=pane][data-widget=terminal]').dispatchEvent('pointerdown')
    await page.locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyL')
    await expect(filter).toBeFocused()
    // The old query is selected, so typing replaces it.
    await page.keyboard.type('x')
    await expect(filter).toHaveValue('x')
  } finally {
    await close()
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

/** The name of a packaged app (Store or MSIX) on this machine, as the Start Menu shows it. */
function packagedAppName(): string | null {
  const script = [
    '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
    "$apps = @((New-Object -ComObject Shell.Application).NameSpace('shell:AppsFolder').Items())",
    // A packaged id as the launcher accepts it, and a name its noise filter keeps ("Get Help" is dropped).
    "$apps | Where-Object { $_.Path -cmatch '^[A-Za-z0-9.-]{1,100}_[a-z0-9]{13}![A-Za-z][A-Za-z0-9.]{0,99}$' -and $_.Name -notmatch '(?i)uninstall|remove|readme|release notes|license|help|website|manual|アンインストール' } |",
    '  Select-Object -First 1 -ExpandProperty Name',
  ].join('\n')
  const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script])
  return out.toString('utf8').trim() || null
}

test('the launcher lists packaged apps that have no Start Menu shortcut, with their icons', async () => {
  test.skip(process.platform !== 'win32', 'packaged apps are a Windows thing')
  // Teams, Outlook and the like have no .lnk; a server image may have none of them.
  const name = packagedAppName()
  test.skip(name === null, 'no packaged apps on this machine')
  const { page, close } = await launch(undefined, { layout: single('launcher') })
  try {
    await page.getByTestId('launcher-filter').fill(name ?? '')
    const entry = page.getByTestId('launcher-entry').filter({
      has: page.locator('.name', { hasText: new RegExp(`^${escapeRegExp(name ?? '')}$`) }),
    })
    await expect(entry.first()).toBeVisible({ timeout: 20_000 })
    await expect(entry.first().getByTestId('launcher-icon')).toBeVisible({ timeout: 20_000 })
  } finally {
    await close()
  }
})

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

for (const theme of ['business-dark', 'business-light']) {
  test(`the launcher shows icons in their own colours in ${theme}`, async () => {
    const { page, close } = await launch(undefined, {
      layout: single('launcher'),
      settings: { theme, sound: { enabled: false } },
    })
    try {
      const icon = page.getByTestId('launcher-icon').first()
      await expect(icon).toBeVisible({ timeout: 20_000 })
      const style = () =>
        icon.evaluate((el) => {
          const s = getComputedStyle(el)
          const img = getComputedStyle(el.querySelector('img') as Element)
          return {
            mask: s.maskImage || s.webkitMaskImage,
            background: s.backgroundColor,
            filter: img.filter,
            blend: img.mixBlendMode,
          }
        })
      await expect
        .poll(style)
        .toEqual({ mask: 'none', background: 'rgba(0, 0, 0, 0)', filter: 'none', blend: 'normal' })
    } finally {
      await close()
    }
  })
}

test('a calendar with room for them shows the months either side', async () => {
  // A pane the size of the window: the month on screen keeps the middle, with
  // the month before and the month after beside it, and only the middle one
  // carries today. The pane in the default layout has room for one.
  const { page, close } = await launch(undefined, { layout: single('calendar') })
  try {
    const grids = page.getByTestId('calendar-grid')
    await expect(grids).toHaveCount(3)
    const months = await grids.evaluateAll((list) =>
      list.map((el) => `${el.dataset.month}${el.hasAttribute('data-current') ? '*' : ''}`),
    )
    const now = new Date()
    const month = (offset: number) => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }
    expect(months).toEqual([month(-1), `${month(0)}*`, month(1)])
    await expect(page.getByTestId('calendar-day')).toHaveCount(126)
    // Today is marked once: in its own month, not as a spare day of the next.
    await expect(page.locator('[data-testid=calendar-day][data-today]')).toHaveCount(1)

    // The arrows move all three, the middle one still leading.
    await page.getByTestId('calendar-next').click()
    await expect(page.getByTestId('calendar-grid').first()).toHaveAttribute('data-month', month(0))
    await expect(page.getByTestId('calendar-title')).toHaveText(
      new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(
        new Date(now.getFullYear(), now.getMonth() + 1, 1),
      ),
    )
  } finally {
    await close()
  }
})

test('a calendar with room for one month shows one', async () => {
  const layout = {
    version: 1,
    root: {
      kind: 'split',
      id: 'root',
      direction: 'row',
      sizes: [0.22, 0.78],
      children: [
        { kind: 'pane', id: 'c', widget: 'calendar' },
        { kind: 'pane', id: 't', widget: 'terminal' },
      ],
    },
  }
  const { page, close } = await launch(undefined, { layout })
  try {
    await expect(page.getByTestId('calendar-grid')).toHaveCount(1)
    await expect(page.getByTestId('calendar-day')).toHaveCount(42)
  } finally {
    await close()
  }
})

test('the calendar is in English, and holidays are ticked per country in its settings', async () => {
  // Japanese app language: the calendar's text stays English regardless.
  let launched = await launch(undefined, { layout: single('calendar'), args: ['--lang=ja'] })
  try {
    const { page } = launched
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    // The pane fills the window, so the months either side are there too.
    await expect(page.getByTestId('calendar-grid')).toHaveCount(3)
    await expect(
      page.locator('[data-testid=calendar-grid][data-current] [data-testid=calendar-day]'),
    ).toHaveCount(42)
    await expect(page.locator('[data-testid=calendar-day][data-today]')).toHaveAttribute(
      'data-date',
      iso(now),
    )
    await expect(page.getByTestId('pane-subtitle')).toContainText(/week \d+/)
    const title = page.getByTestId('calendar-title')
    await expect(title).toHaveText(
      new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(now),
    )
    await expect(page.getByTestId('calendar')).not.toContainText(/[぀-ヿ一-鿿]/)

    const shown = await title.textContent()
    await page.getByTestId('calendar-next').click()
    await expect(title).not.toHaveText(shown ?? '')
    await page.getByTestId('calendar-today').click()
    await expect(title).toHaveText(shown ?? '')

    // Off by default: no holiday is marked, even on 1 January.
    await expect(page.getByTestId('calendar')).toHaveAttribute('data-holidays', 'none')
    await expect(page.locator('[data-testid=calendar-day][data-holiday]')).toHaveCount(0)

    // Ticked in the settings panel, where other countries will join Japan.
    await expect(page.getByTestId('calendar-settings')).toHaveCount(0)
    await page.getByTestId('calendar-settings-toggle').click()
    const japan = page.getByTestId('calendar-holidays-jp')
    await expect(japan).not.toBeChecked()
    await japan.check()
    await expect(page.getByTestId('calendar')).toHaveAttribute('data-holidays', 'jp')
    for (let i = 0; i < 12 && (await page.locator('[data-date$="-01-01"]').count()) === 0; i++) {
      await page.getByTestId('calendar-next').click()
    }
    await expect(page.locator('[data-date$="-01-01"]').first()).toHaveAttribute(
      'data-holiday',
      "New Year's Day",
    )
    await expect(page.getByTestId('calendar-next-holiday')).toContainText('next holiday')

    await page.waitForTimeout(1500) // let the layout save
    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('calendar')).toHaveAttribute('data-holidays', 'jp')
    await launched.page.getByTestId('calendar-settings-toggle').click()
    await expect(launched.page.getByTestId('calendar-holidays-jp')).toBeChecked()
  } finally {
    await launched.close()
  }
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
      await page.getByTestId('markets-settings-toggle').click()
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

  test('candles and a longer range: main keeps only the chosen chart, and both survive a restart', async () => {
    let launched = await launch(undefined, {
      // Saved before ranges existed: no range in the pane state.
      layout: single('markets', { symbols: [{ symbol: '^N225', label: '日経平均' }] }),
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

      await page.getByTestId('markets-settings-toggle').click()
      await page.getByTestId('markets-range-6mo').check()
      await expect(markets).toHaveAttribute('data-range', '6mo')
      await expect(page.getByTestId('markets-range')).toHaveText('6M · 1d')
      // The 1D chart is dropped as the 6M one is taken; the symbol is quoted once throughout.
      await expect.poll(charts, { timeout: 10_000 }).toEqual(['^N225|6mo'])
      expect(await page.evaluate(() => window.elecdex.markets.watching())).toEqual(['^N225'])
      await expect.poll(() => chartRequests.includes('^N225|6mo'), { timeout: 10_000 }).toBe(true)
      // Measured from the close before the six months (800), not the day's change.
      await expect(page.getByTestId('market-row')).toContainText('+25.00%', { timeout: 10_000 })
      await expect(page.getByTestId('pane-subtitle')).toContainText('6M ·')
      await expect(candles).toHaveAttribute('data-bars', /^[1-9]\d*$/)

      await page.getByTestId('markets-view').locator('[data-view=bars]').click()
      const bar = page.getByTestId('market-bar')
      await expect(bar).toHaveAttribute('data-pct', '25.00')
      await expect(bar).toHaveAttribute('title', /base 800.00 \(.+ close\) → 1,000/)

      await page.waitForTimeout(1500) // let the layout save
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

  test('in a wide pane the charts start near the names, and candle rows are twice as tall', async () => {
    const { page, close } = await launch(undefined, {
      layout: single('markets', { symbols: [{ symbol: '^N225' }, { symbol: 'JPY=X' }] }),
      env: { ELECDEX_MARKETS_STUB_URL: stubUrl },
    })
    try {
      const markets = page.getByTestId('markets')
      const measure = () =>
        page
          .getByTestId('market-row')
          .first()
          .evaluate((row) => {
            const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
            const chart = row.querySelector('.chart') as Element
            return {
              rowWidth: row.getBoundingClientRect().width / rem,
              nameToChart:
                (chart.getBoundingClientRect().left - row.getBoundingClientRect().left) / rem,
              height: row.getBoundingClientRect().height,
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

      await page.getByTestId('markets-view').locator('[data-view=candles]').click()
      await expect(markets).toHaveAttribute('data-view', 'candles')
      const candles = await measure()
      expect(candles.nameToChart).toBeCloseTo(line.nameToChart, 1)
      expect(candles.height / line.height).toBeCloseTo(2, 1)

      // Back to lines, the rows are as they were.
      await page.getByTestId('markets-view').locator('[data-view=line]').click()
      expect((await measure()).height).toBeCloseTo(line.height, 0)
    } finally {
      await close()
    }
  })

  test('a watchlist longer than the pane scrolls in both views instead of covering the credit', async () => {
    // The default layout's markets pane is short and its watchlist has eight symbols.
    const { page, close } = await launch()
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
