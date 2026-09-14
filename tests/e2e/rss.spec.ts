import { existsSync } from 'node:fs'
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The RSS pane, against a local server standing in for the sites.
 *
 * What matters beyond showing headlines: the pane is not there until added, a
 * pane without feeds fetches nothing, a feed is asked for once however many
 * times it is listed, and closing the pane stops the fetching. No test here
 * reaches a real site.
 */

let server: Server
let origin: string
const requests: Array<{ path: string; headers: IncomingHttpHeaders }> = []

/** `count` items an hour apart, the newest `offsetHours` before a fixed time. */
function rss(title: string, count: number, offsetHours: number): string {
  const items = Array.from({ length: count }, (_, i) => {
    const at = new Date(Date.UTC(2026, 8, 14, 12) - (offsetHours + i) * 3_600_000)
    return `<item><title>${title} story ${i + 1}</title><link>${origin}/${title}/${i + 1}</link><pubDate>${at.toUTCString()}</pubDate></item>`
  }).join('')
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>${title} news</title>${items}</channel></rss>`
}

function atom(title: string, count: number, offsetHours: number): string {
  const entries = Array.from({ length: count }, (_, i) => {
    const at = new Date(Date.UTC(2026, 8, 14, 12) - (offsetHours + i) * 3_600_000)
    return `<entry><title>${title} post ${i + 1}</title><link href="/${title}/${i + 1}"/><updated>${at.toISOString()}</updated></entry>`
  }).join('')
  return `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>${title} blog</title>${entries}</feed>`
}

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const url = req.url ?? ''
    requests.push({ path: url, headers: req.headers })
    if (url === '/alpha.xml') {
      if (req.headers['if-none-match'] === '"alpha"') {
        res.writeHead(304).end()
        return
      }
      res.writeHead(200, { 'content-type': 'application/rss+xml', etag: '"alpha"' })
      res.end(rss('alpha', 15, 0))
    } else if (url === '/beta.atom') {
      // Half an hour after each alpha story, so the two feeds interleave.
      res.writeHead(200, { 'content-type': 'application/atom+xml' }).end(atom('beta', 15, 0.5))
    } else {
      res.writeHead(404).end()
    }
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

const rssPane = (page: Page) => page.locator('[data-testid=pane][data-widget=rss]')
const watching = (page: Page) => page.evaluate(() => window.elecdex.feeds.watching())
const single = (widget: string, state?: Record<string, unknown>) => ({
  version: 1,
  root: { kind: 'pane', id: 'p', widget, ...(state ? { state } : {}) },
})

test('the RSS pane is not in the default layout, and nothing is fetched without one', async () => {
  const { page, userData, close } = await launch()
  try {
    await expect(page.locator('[data-testid=pane][data-widget=clock]')).toHaveCount(1)
    await expect(rssPane(page)).toHaveCount(0)
    expect(await watching(page)).toEqual([])

    // It is offered in the picker.
    await page.keyboard.press('Control+Shift+KeyA')
    const picker = page.getByTestId('pane-picker')
    await page.keyboard.type('rss')
    await expect(picker.getByTestId('pane-picker-item')).toHaveAttribute('data-widget', 'rss')
    await page.keyboard.press('Escape')
    expect(requests).toEqual([])
    // Not even the feed cache is touched without an RSS pane.
    expect(existsSync(path.join(userData, 'feeds-cache.json'))).toBe(false)
  } finally {
    await close()
  }
})

test('added from the picker it starts empty; its feeds merge newest first, open in the browser and survive a restart', async () => {
  let launched = await launch(undefined, { layout: single('clock') })
  try {
    const { app, page } = launched
    await page.keyboard.press('Control+Shift+KeyA')
    await page.locator('[data-testid=pane-picker-item][data-widget=rss]').click()
    const pane = rssPane(page)

    // Empty: a note in the muted text colour, and no request.
    const empty = pane.getByTestId('rss-empty')
    await expect(empty).toHaveText('No feeds yet. Press FEEDS to add RSS or Atom feed URLs.')
    const colours = await empty.evaluate((el) => {
      const probe = document.createElement('span')
      probe.style.color = 'var(--text-muted)'
      el.append(probe)
      const muted = getComputedStyle(probe).color
      probe.remove()
      return { actual: getComputedStyle(el).color, muted }
    })
    expect(colours.actual).toBe(colours.muted)
    expect(await watching(page)).toEqual([])

    // A line that is not a feed URL is reported, not dropped.
    await pane.getByTestId('rss-edit').click()
    await pane.getByTestId('rss-feeds').fill(`${origin}/alpha.xml\nnot a url`)
    await pane.getByTestId('rss-save').click()
    await expect(pane.getByTestId('rss-problem')).toHaveText('not a feed URL: not a url')
    expect(await watching(page)).toEqual([])

    // Listed twice, fetched once.
    await pane
      .getByTestId('rss-feeds')
      .fill(`${origin}/alpha.xml\n${origin}/beta.atom\n${origin}/alpha.xml`)
    await pane.getByTestId('rss-save').click()
    const items = pane.getByTestId('rss-item')
    await expect(items).toHaveCount(20, { timeout: 20_000 })
    expect(await watching(page)).toEqual([`${origin}/alpha.xml`, `${origin}/beta.atom`])
    expect(requests.map((r) => r.path).sort()).toEqual(['/alpha.xml', '/beta.atom'])
    expect(requests[0]?.headers['user-agent']).toMatch(/^elecdex\//)

    await expect(items.nth(0)).toContainText('alpha story 1')
    // The time or the date, depending on the local day (formatItemTime is unit-tested).
    await expect(items.nth(0).locator('.meta')).toHaveText(
      /^alpha news · (\d\d:\d\d|\d{1,2}\/\d{1,2})$/,
    )
    await expect(items.nth(1)).toContainText('beta post 1')
    await expect(items.nth(1)).toContainText('beta blog')
    await expect(items.nth(2)).toContainText('alpha story 2')
    await expect(pane.getByTestId('pane-subtitle')).toHaveText(/^2 feeds · updated \d\d:\d\d$/)

    // The list scrolls within the pane rather than growing past it.
    const list = pane.getByTestId('rss-items')
    await expect(list).toHaveCSS('overflow-y', 'auto')
    await items.nth(19).scrollIntoViewIfNeeded()
    await expect(items.nth(19)).toBeInViewport()

    // A headline opens its article in the browser, through main.
    await app.evaluate(({ shell }) => {
      const opened: string[] = []
      ;(globalThis as { __opened?: string[] }).__opened = opened
      shell.openExternal = async (url: string) => {
        opened.push(url)
      }
    })
    await items.nth(1).click()
    await expect
      .poll(() => app.evaluate(() => (globalThis as { __opened?: string[] }).__opened))
      .toEqual([`${origin}/beta/1`])

    // A restart shows the saved headlines at once and does not ask again so soon.
    await page.waitForTimeout(1500) // let the layout save
    requests.length = 0
    launched = await launched.relaunch()
    await expect(rssPane(launched.page).getByTestId('rss-item')).toHaveCount(20)
    await launched.page.waitForTimeout(1500)
    expect(requests).toEqual([])
  } finally {
    await launched.close()
  }
})

test('a failing feed is marked and the rest still show; closing the pane stops the fetching', async () => {
  const { page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'split',
        id: 's',
        direction: 'row',
        sizes: [0.5, 0.5],
        children: [
          {
            kind: 'pane',
            id: 'r',
            widget: 'rss',
            state: { feeds: [`${origin}/alpha.xml`, `${origin}/gone.xml`] },
          },
          { kind: 'pane', id: 'c', widget: 'clock' },
        ],
      },
    },
  })
  try {
    const pane = rssPane(page)
    await expect(pane.getByTestId('rss-item')).toHaveCount(15, { timeout: 20_000 })
    await expect(pane.getByTestId('pane-badge')).toHaveText('stale')

    // Adding a feed fetches only that one: the feeds already listed are not
    // restarted, so the failing one is not asked again before its retry.
    requests.length = 0
    await pane.getByTestId('rss-edit').click()
    await pane
      .getByTestId('rss-feeds')
      .fill([`${origin}/alpha.xml`, `${origin}/gone.xml`, `${origin}/beta.atom`].join('\n'))
    await pane.getByTestId('rss-save').click()
    await expect(pane.getByTestId('rss-item')).toHaveCount(20, { timeout: 20_000 })
    await page.waitForTimeout(1000)
    expect(requests.map((r) => r.path)).toEqual(['/beta.atom'])

    await pane.getByTestId('rss-edit').click()
    await pane.getByTestId('rss-feeds').fill(`${origin}/gone.xml`)
    await pane.getByTestId('rss-save').click()
    await expect(pane.getByTestId('rss-status')).toHaveText('could not read the feeds: HTTP 404')
    await expect.poll(() => watching(page)).toEqual([`${origin}/gone.xml`])

    await pane.hover()
    await pane.getByTestId('pane-close').click()
    await expect(rssPane(page)).toHaveCount(0)
    await expect.poll(() => watching(page)).toEqual([])
  } finally {
    await close()
  }
})
