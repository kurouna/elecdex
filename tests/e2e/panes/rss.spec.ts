import { existsSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import type { FeedItem, FeedUpdate } from '@shared/feeds'
import { test } from '../support/shared.js'
import { openedExternally, stubOpenExternal } from '../support/stubs/external.js'
import { type ServiceStub, type StubRequest, serviceStub } from '../support/stubs/services.js'
import {
  beside,
  launch,
  quietFor,
  single,
  waitForSaved,
  watching as watchingOf,
} from '../support.js'

/**
 * The RSS pane, against a local server standing in for the sites.
 *
 * What matters beyond showing headlines: the pane is not there until added, a
 * pane without feeds fetches nothing, a feed is asked for once however many
 * times it is listed, and closing the pane stops the fetching. No test here
 * reaches a real site.
 */

let stub: ServiceStub
let origin: string
let requests: StubRequest[]

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
  stub = await serviceStub(({ url, headers }) => {
    if (url === '/alpha.xml') {
      if (headers['if-none-match'] === '"alpha"') return { status: 304 }
      return {
        status: 200,
        headers: { 'content-type': 'application/rss+xml', etag: '"alpha"' },
        body: rss('alpha', 15, 0),
      }
    }
    if (url === '/beta.atom') {
      // Half an hour after each alpha story, so the two feeds interleave.
      return {
        status: 200,
        headers: { 'content-type': 'application/atom+xml' },
        body: atom('beta', 15, 0.5),
      }
    }
    return { status: 404 }
  })
  ;({ origin, requests } = stub)
})

test.afterAll(async () => {
  await stub.close()
})

test.beforeEach(() => {
  requests.length = 0
})

const rssPane = (page: Page) => page.locator('[data-testid=pane][data-widget=rss]')
const watching = (page: Page) => watchingOf(page, 'feeds')
const layout = (widget: string, state?: Record<string, unknown>) =>
  single(widget, state === undefined ? { id: 'p' } : { id: 'p', state })

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
  let launched = await launch(undefined, { layout: layout('clock') })
  try {
    const { app, page } = launched
    await page.keyboard.press('Control+Shift+KeyA')
    await page.locator('[data-testid=pane-picker-item][data-widget=rss]').click()
    const pane = rssPane(page)

    // Empty: a note in the muted text colour, and no request.
    const empty = pane.getByTestId('rss-empty')
    await expect(empty).toHaveText(
      'No feeds yet. Open the settings at the top right to add RSS or Atom feed URLs.',
    )
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
    await pane.getByTestId('rss-settings-toggle').click()
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
    expect(requests.map((r) => r.url).sort()).toEqual(['/alpha.xml', '/beta.atom'])
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
    await stubOpenExternal(app)
    await items.nth(1).click()
    await expect.poll(() => openedExternally(app)).toEqual([`${origin}/beta/1`])

    // A restart shows the saved headlines at once and does not ask again so soon.
    await waitForSaved(launched.userData, (text) => {
      const flat = text.replace(/\s/g, '')
      return flat.includes('"widget":"rss"') && flat.includes('/beta.atom')
    })
    requests.length = 0
    launched = await launched.relaunch()
    await expect(rssPane(launched.page).getByTestId('rss-item')).toHaveCount(20)
    await quietFor(1500, async () => requests.length, 'the requests')
    expect(requests).toEqual([])
  } finally {
    await launched.close()
  }
})

test('a failing feed is marked and the rest still show; closing the pane stops the fetching', async ({
  shared,
}) => {
  const { page, close } = await shared({
    layout: beside('rss', {
      id: 'r',
      state: { feeds: [`${origin}/alpha.xml`, `${origin}/gone.xml`] },
      sizes: [0.5, 0.5],
    }),
  })
  try {
    const pane = rssPane(page)
    await expect(pane.getByTestId('rss-item')).toHaveCount(15, { timeout: 20_000 })
    await expect(pane.getByTestId('pane-badge')).toHaveText('stale')

    // Adding a feed fetches only that one: the feeds already listed are not
    // restarted, so the failing one is not asked again before its retry.
    requests.length = 0
    await pane.getByTestId('rss-settings-toggle').click()
    await pane
      .getByTestId('rss-feeds')
      .fill([`${origin}/alpha.xml`, `${origin}/gone.xml`, `${origin}/beta.atom`].join('\n'))
    await pane.getByTestId('rss-save').click()
    await expect(pane.getByTestId('rss-item')).toHaveCount(20, { timeout: 20_000 })
    await quietFor(1000, async () => requests.length, 'the requests')
    expect(requests.map((r) => r.url)).toEqual(['/beta.atom'])

    await pane.getByTestId('rss-settings-toggle').click()
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

test('a new headline slides in with a highlight; a feed added later, or an item too old for the list, is not new', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: layout('rss', { feeds: [`${origin}/alpha.xml`] }),
  })
  try {
    const pane = rssPane(page)
    const items = pane.getByTestId('rss-item')
    const fresh = pane.locator('[data-testid=rss-items] li[data-fresh]')
    await expect(items).toHaveCount(15, { timeout: 20_000 })
    expect(await fresh.count()).toBe(0)

    // A second feed joins the list: its items interleave, but none is news.
    await pane.getByTestId('rss-settings-toggle').click()
    await pane.getByTestId('rss-feeds').fill(`${origin}/alpha.xml\n${origin}/beta.atom`)
    await pane.getByTestId('rss-save').click()
    await expect(items).toHaveCount(20, { timeout: 20_000 })
    await expect(items.nth(1)).toContainText('beta post 1')
    expect(await fresh.count()).toBe(0)

    // Alpha's next download, as main would send it: one story newer than all, and
    // one older than anything the list of 20 keeps.
    const alpha = await page.evaluate(
      (url) =>
        new Promise<FeedUpdate>((resolve) => {
          const off = window.elecdex.feeds.subscribe(url, (update) => {
            off()
            resolve(update)
          })
        }),
      `${origin}/alpha.xml`,
    )
    const story = (title: string, at: number): FeedItem => ({
      ...(alpha.items[0] as FeedItem),
      title,
      link: `${origin}/alpha/${title}`,
      at,
    })
    const next: FeedUpdate = {
      ...alpha,
      fetchedAt: Date.now(),
      items: [
        story('breaking', Date.UTC(2026, 8, 14, 13)),
        ...alpha.items,
        story('ancient', Date.UTC(2020, 0, 1)),
      ],
    }
    await app.evaluate(({ BrowserWindow }, payload) => {
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send('feeds:update', payload)
    }, next)

    await expect(items.first()).toContainText('breaking')
    await expect(fresh).toHaveCount(1)
    await expect(fresh).toContainText('breaking')
    await expect(pane.getByTestId('rss-new')).toHaveCount(0)
    await expect(fresh).toHaveCount(0, { timeout: 6000 })
  } finally {
    await close()
  }
})
