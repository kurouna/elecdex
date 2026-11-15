import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import type { FeedItem, FeedUpdate } from '@shared/feeds'
import { bringWindowBack, pickerAnswers, saveDialogAnswers } from '../support/os.js'
import { test } from '../support/shared.js'
import { aiSettings, openaiProvider } from '../support/stubs/ai.js'
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
 * pane without feeds fetches nothing (its first look is ADD and the packs, and a
 * pack is never fetched until added - no test here adds one), a feed is asked for
 * once however many times it is listed, closing the pane stops the fetching, and
 * a page or picture is fetched only when the user asks for it. No test here
 * reaches a real site.
 */

let stub: ServiceStub
let origin: string
let requests: StubRequest[]

/** A 1x1 PNG, so main's decoder has a real picture to shrink. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

/** The time the stories are dated from: an hour apart, the newest `offsetHours` before it. */
const BASE = Date.UTC(2026, 8, 14, 12)
const storyAt = (offsetHours: number, i: number) => BASE - (offsetHours + i) * 3_600_000

/** `count` items an hour apart; the first carries a summary, an author and a picture. */
function rss(title: string, count: number, offsetHours: number): string {
  const items = Array.from({ length: count }, (_, i) => {
    const at = new Date(storyAt(offsetHours, i))
    const extra =
      i === 0
        ? `<description>&lt;p&gt;The first ${title} story, in brief.&lt;/p&gt;</description><dc:creator>Desk</dc:creator><media:thumbnail url="${origin}/pic.png"/>`
        : ''
    return `<item><title>${title} story ${i + 1}</title><link>${origin}/${title}/${i + 1}</link><pubDate>${at.toUTCString()}</pubDate>${extra}</item>`
  }).join('')
  return `<?xml version="1.0"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>${title} news</title>${items}</channel></rss>`
}

function atom(title: string, count: number, offsetHours: number): string {
  const entries = Array.from({ length: count }, (_, i) => {
    const at = new Date(storyAt(offsetHours, i))
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
    if (url === '/site/') {
      return {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: `<html><head><title>Site</title><link rel="alternate" type="application/rss+xml" title="Alpha, all" href="/alpha.xml"><link rel="alternate" type="application/atom+xml" title="Beta posts" href="../beta.atom"></head><body></body></html>`,
      }
    }
    if (url === '/pic.png')
      return { status: 200, headers: { 'content-type': 'image/png' }, body: PNG }
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
const ALPHA = () => `${origin}/alpha.xml`
const BETA = () => `${origin}/beta.atom`

/** Finds feeds for `input` through ADD and adds the candidate whose URL is `url`. */
async function addThroughFind(page: Page, input: string, url: string): Promise<void> {
  const pane = rssPane(page)
  await pane.getByTestId('rss-add-input').fill(input)
  await pane.getByTestId('rss-find').click()
  const candidate = pane.getByTestId('rss-candidate').filter({ hasText: url })
  await candidate.getByTestId('rss-candidate-add').click()
  await expect(candidate).toContainText('added')
}

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
    // Not even the feed cache or the read marks are touched without an RSS pane.
    expect(existsSync(path.join(userData, 'feeds-cache.json'))).toBe(false)
    expect(existsSync(path.join(userData, 'feeds-read.json'))).toBe(false)
  } finally {
    await close()
  }
})

test('added from the picker it opens on ADD and the packs; found feeds merge newest first and survive a restart', async () => {
  let launched = await launch(undefined, { layout: layout('clock') })
  try {
    const { page } = launched
    await page.keyboard.press('Control+Shift+KeyA')
    await page.locator('[data-testid=pane-picker-item][data-widget=rss]').click()
    const pane = rssPane(page)

    // Empty: a way in, not a blank - and nothing asked of any site, a pack's included.
    await expect(pane.getByTestId('rss-empty')).toContainText('no feeds')
    await expect(pane.getByTestId('rss-pack').first()).toBeVisible()
    await expect(pane.getByTestId('rss-add-input')).toBeVisible()
    // Someone moving from another reader can start from its list; there is nothing to export yet.
    await expect(pane.getByTestId('rss-opml-import')).toBeVisible()
    await expect(pane.getByTestId('rss-opml-export')).toHaveCount(0)
    await quietFor(800, async () => requests.length, 'the requests')
    expect(requests).toEqual([])
    expect(await watching(page)).toEqual([])

    // Something that is not a site is refused in the page: nothing goes out.
    await pane.getByTestId('rss-add-input').fill('file:///C:/Windows/win.ini')
    await pane.getByTestId('rss-find').click()
    await expect(pane.getByTestId('rss-problem')).toContainText('not a site')
    expect(requests).toEqual([])

    // A site's page names its feeds; FIND reads the page once and lists them.
    await pane.getByTestId('rss-add-input').fill(`${origin}/site/`)
    await pane.getByTestId('rss-find').click()
    const candidates = pane.getByTestId('rss-candidate')
    await expect(candidates).toHaveCount(2)
    await expect(candidates.nth(0)).toContainText('Alpha, all')
    await expect(candidates.nth(1)).toContainText(BETA())
    expect(requests.map((r) => r.url)).toEqual(['/site/'])
    await candidates.nth(0).getByTestId('rss-candidate-add').click()

    // The first feed added, the pane leaves ADD for its headlines.
    const items = pane.getByTestId('rss-item')
    await expect(items).toHaveCount(15, { timeout: 20_000 })
    // A second, as a feed URL typed in: it is its own answer.
    await pane.getByTestId('rss-settings-toggle').click()
    await pane.getByTestId('rss-tab-add').click()
    await addThroughFind(page, BETA(), BETA())
    await pane.getByTestId('rss-settings-toggle').click()

    await expect(items).toHaveCount(20, { timeout: 20_000 })
    expect(await watching(page)).toEqual([ALPHA(), BETA()])
    // The page, each feed once (beta read once as FIND's answer, once as a feed); no picture yet.
    expect(requests.filter((r) => r.url === '/alpha.xml')).toHaveLength(1)
    expect(requests.some((r) => r.url === '/pic.png')).toBe(false)
    expect(requests[0]?.headers['user-agent']).toMatch(/^elecdex\//)

    await expect(items.nth(0)).toContainText('alpha story 1')
    await expect(items.nth(0).locator('.meta')).toHaveText('alpha news · Desk')
    // The time or the date, depending on the local day (formatItemTime is unit-tested).
    await expect(items.nth(0).locator('.tm')).toHaveText(/^(\d\d:\d\d|\d{1,2}\/\d{1,2})$/)
    await expect(items.nth(1)).toContainText('beta post 1')
    await expect(items.nth(1)).toContainText('beta blog')
    await expect(items.nth(2)).toContainText('alpha story 2')
    await expect(pane.getByTestId('pane-subtitle')).toHaveText(/^2 feeds · updated \d\d:\d\d$/)
    // Each feed has its mark, in its own hue.
    const marks = await items.evaluateAll((rows) =>
      rows.slice(0, 2).map((row) => {
        const mark = row.querySelector('[data-testid=rss-mark]') as HTMLElement
        return { tag: mark.textContent, colour: getComputedStyle(mark).color }
      }),
    )
    expect(marks.map((m) => m.tag)).toEqual(['AN', 'BB'])
    expect(marks[0]?.colour).not.toBe(marks[1]?.colour)
    await expect(pane.getByTestId('rss-day').first()).toBeVisible()

    // The list scrolls within the pane rather than growing past it.
    const list = pane.getByTestId('rss-items')
    await expect(list).toHaveCSS('overflow-y', 'auto')
    await items.nth(19).scrollIntoViewIfNeeded()
    await expect(items.nth(19)).toBeInViewport()

    // A restart shows the saved headlines at once and does not ask again so soon.
    await waitForSaved(launched.userData, (text) => {
      const flat = text.replace(/\s/g, '')
      return (
        flat.includes('"widget":"rss"') && flat.includes('/beta.atom') && flat.includes('"marks"')
      )
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

test('a headline opens its article: picture, summary, OPEN in the browser, and it stays read in every pane and after a restart', async () => {
  let launched = await launch(undefined, {
    layout: beside('rss', {
      id: 'r',
      state: { feeds: [`${origin}/alpha.xml`] },
      sizes: [0.5, 0.5],
    }),
  })
  try {
    const { app, page } = launched
    const pane = rssPane(page)
    const items = pane.getByTestId('rss-item')
    await expect(items).toHaveCount(15, { timeout: 20_000 })
    expect(requests.some((r) => r.url === '/pic.png')).toBe(false)

    await items.nth(0).click()
    const article = pane.getByTestId('rss-article')
    await expect(article).toBeVisible()
    await expect(article).toBeFocused()
    await expect(article.getByTestId('rss-article-title')).toHaveText('alpha story 1')
    await expect(article.getByTestId('rss-article-summary')).toHaveText(
      'The first alpha story, in brief.',
    )
    // The picture comes through main as a data URL; the page itself loads nothing.
    await expect(article.getByTestId('rss-picture')).toHaveAttribute('data-loaded', 'true')
    await expect(article.locator('img')).toHaveAttribute('src', /^data:image\/jpeg;base64,/)
    expect(requests.filter((r) => r.url === '/pic.png')).toHaveLength(1)
    // Opened, the headline is read.
    await expect(items.nth(0)).toHaveAttribute('data-read', 'true')
    await expect(pane.getByTestId('rss-unread')).toHaveText('14')

    await stubOpenExternal(app)
    await article.getByTestId('rss-open').click()
    await expect.poll(() => openedExternally(app)).toEqual([`${origin}/alpha/1`])

    // Escape closes it and gives the keyboard back to the row.
    await article.press('Escape')
    await expect(article).toHaveCount(0)
    await expect(items.nth(0)).toBeFocused()

    // MARK UNREAD puts it back; opening the second marks that one.
    await items.nth(1).click()
    await expect(items.nth(1)).toHaveAttribute('data-read', 'true')
    await pane.getByTestId('rss-mark-read').click()
    await expect(items.nth(1)).not.toHaveAttribute('data-read')
    await pane.getByTestId('rss-article-close').click()

    await expect.poll(() => existsSync(path.join(launched.userData, 'feeds-read.json'))).toBe(true)
    launched = await launched.relaunch()
    const again = rssPane(launched.page).getByTestId('rss-item')
    await expect(again).toHaveCount(15)
    await expect(again.nth(0)).toHaveAttribute('data-read', 'true')
    await expect(again.nth(1)).not.toHaveAttribute('data-read')

    // UNREAD shows only what is not read; MARK ALL READ reads every headline shown, through main.
    const pane2 = rssPane(launched.page)
    await pane2.getByTestId('rss-unread-only').click()
    await expect(again).toHaveCount(14)
    await pane2.getByTestId('rss-unread-only').click()
    await expect(again).toHaveCount(15)
    await pane2.getByTestId('rss-mark-all-read').click()
    await expect(pane2.locator('[data-testid=rss-item][data-read]')).toHaveCount(15)
    await expect(pane2.getByTestId('rss-unread')).toHaveText('0')
    await expect(pane2.getByTestId('rss-mark-all-read')).toBeDisabled()
  } finally {
    await launched.close()
  }
})

test('Escape closes the article first, popped up or forward, and only then the popup or the zoom', async () => {
  const launched = await launch(undefined, {
    layout: layout('rss', { feeds: [`${origin}/alpha.xml`] }),
  })
  try {
    const { page } = launched
    const pane = rssPane(page)
    await expect(pane.getByTestId('rss-item')).toHaveCount(15, { timeout: 20_000 })

    // Forward: the first Escape closes the article, the second puts the pane back.
    await pane.getByTestId('rss-item').nth(0).click()
    await page.keyboard.press('Control+Shift+KeyZ')
    const forward = page.locator('[data-testid=pane].pane-pinned')
    await expect(forward).toHaveCount(1)
    await pane.getByTestId('rss-article').focus()
    await page.keyboard.press('Escape')
    await expect(pane.getByTestId('rss-article')).toHaveCount(0)
    await expect(forward).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(forward).toHaveCount(0)

    // Popped up (a popup keeps its own state: it starts with no feeds, one is added here).
    await page.keyboard.press('Control+Shift+KeyA')
    const picker = page.getByTestId('pane-picker')
    await picker.locator('[data-testid=pane-picker-placement][data-placement=popup]').click()
    await picker.locator('[data-testid=pane-picker-item][data-widget=rss]').click()
    const popup = page.getByTestId('popup-pane')
    await expect(popup).toHaveAttribute('data-widget', 'rss')
    await popup.getByTestId('rss-add-input').fill(ALPHA())
    await popup.getByTestId('rss-find').click()
    await popup.getByTestId('rss-candidate-add').click()
    await expect(popup.getByTestId('rss-item')).toHaveCount(15, { timeout: 20_000 })
    await popup.getByTestId('rss-item').nth(0).click()
    await expect(popup.getByTestId('rss-article')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(popup.getByTestId('rss-article')).toHaveCount(0)
    await expect(popup).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(popup).toHaveCount(0)
  } finally {
    await launched.close()
  }
})

test('CARD shows pictures, TICKER one headline at a time; the choice is kept', async () => {
  const launched = await launch(undefined, {
    layout: layout('rss', { feeds: [`${origin}/alpha.xml`, `${origin}/beta.atom`] }),
  })
  try {
    const { page, userData } = launched
    const pane = rssPane(page)
    await expect(pane.getByTestId('rss-item')).toHaveCount(20, { timeout: 20_000 })

    await pane.getByTestId('rss-view-card').click()
    await expect(pane.getByTestId('rss-cards')).toBeVisible()
    await expect(pane.getByTestId('rss-item')).toHaveCount(20)
    // Only the item with a picture asks for one; the rest draw their feed's plate.
    await expect(pane.locator('[data-testid=rss-picture][data-loaded]')).toHaveCount(1)
    await expect(pane.getByTestId('rss-picture')).toHaveCount(20)

    // A search left in CARD does not follow into TICKER, which has no box to show it in.
    await pane.getByTestId('rss-search').fill('beta')
    await expect(pane.getByTestId('rss-item')).toHaveCount(15)
    await pane.getByTestId('rss-view-ticker').click()
    const ticker = pane.getByTestId('rss-ticker')
    await expect(ticker).toBeVisible()
    await expect(pane.getByTestId('rss-item')).toHaveCount(1)
    const count = pane.getByTestId('rss-ticker-count')
    // Held first: until the pointer is on it the ticker steps on its own 6 s beat, which could
    // land between a step pressed here and its check (a test once read the beat's step for its own).
    await ticker.hover()
    await expect(ticker).toHaveAttribute('data-held', 'true')
    const at = Number(((await count.textContent()) ?? '').split('/')[0])
    const from = (n: number) => `${((((at - 1 + n) % 20) + 20) % 20) + 1}/20`
    await pane.getByTestId('rss-ticker-next').click()
    await expect(count).toHaveText(from(1))
    // A step blinks its three beats first, as every choice does; a press during it is dropped.
    await pane.getByTestId('rss-ticker-prev').click()
    await expect(count).toHaveText(from(0))
    await pane.getByTestId('rss-ticker-prev').click()
    await expect(count).toHaveText(from(-1))
    // Held, it does not move past its 6 s beat.
    const held = await quietFor(6500, () => count.textContent(), 'the ticker')
    expect(held).toBe(from(-1))
    // The first headline is the newest of all the feeds, with the search cleared.
    while ((await count.textContent()) !== '1/20') {
      const before = (await count.textContent()) ?? ''
      await pane.getByTestId('rss-ticker-next').click()
      await expect(count).not.toHaveText(before)
    }
    await expect(pane.getByTestId('rss-ticker-title')).toHaveText('alpha story 1')

    await waitForSaved(userData, (text) => text.replace(/\s/g, '').includes('"view":"ticker"'))
  } finally {
    await launched.close()
  }
})

test('the chips narrow to one feed, find searches, and keywords light or mute headlines', async () => {
  const launched = await launch(undefined, {
    layout: layout('rss', { feeds: [`${origin}/alpha.xml`, `${origin}/beta.atom`] }),
  })
  try {
    const { page } = launched
    const pane = rssPane(page)
    const items = pane.getByTestId('rss-item')
    await expect(items).toHaveCount(20, { timeout: 20_000 })

    // A feed's chip shows that feed's own newest twenty (here fifteen), not a slice of the mix.
    await pane.getByTestId('rss-chip').filter({ hasText: 'beta blog' }).click()
    await expect(items).toHaveCount(15)
    await expect(items.filter({ hasText: 'alpha' })).toHaveCount(0)
    await pane.getByTestId('rss-chip').filter({ hasText: 'all' }).click()
    await expect(items).toHaveCount(20)

    await pane.getByTestId('rss-search').fill('story 1')
    // story 1, and story 10 to 15: alpha's only, from all it keeps.
    await expect(items).toHaveCount(7)
    await expect(items.first().getByTestId('rss-lit')).toHaveText('story 1')
    await pane.getByTestId('rss-search').fill('')
    await expect(items).toHaveCount(20)

    await pane.getByTestId('rss-settings-toggle').click()
    await pane.getByTestId('rss-tab-keywords').click()
    await pane.getByTestId('rss-word-input-mute').fill('beta')
    await pane.getByTestId('rss-word-input-mute').press('Enter')
    await pane.getByTestId('rss-word-input-highlight').fill('STORY')
    await pane.getByTestId('rss-word-input-highlight').press('Enter')
    await expect(pane.getByTestId('rss-word')).toHaveCount(2)
    await pane.getByTestId('rss-settings-toggle').click()

    // Muted headlines go, and older ones fill the list; the bar counts what is hidden.
    await expect(items).toHaveCount(15)
    await expect(items.filter({ hasText: 'beta' })).toHaveCount(0)
    await expect(pane.getByTestId('rss-muted')).toHaveText('15')
    await expect(items.first().getByTestId('rss-lit')).toHaveText('story')

    // A tag written in FEEDS replaces the one from the title; emptied, the title's comes back.
    await pane.getByTestId('rss-settings-toggle').click()
    await pane.getByTestId('rss-tab-feeds').click()
    const tag = pane.getByTestId('rss-feed-row').nth(0).getByTestId('rss-tag')
    await expect(tag).toHaveValue('')
    await expect(tag).toHaveAttribute('placeholder', 'AN')
    await tag.fill('al')
    await tag.press('Enter')
    await pane.getByTestId('rss-settings-toggle').click()
    await expect(items.first().getByTestId('rss-mark')).toHaveText('AL')
    await pane.getByTestId('rss-settings-toggle').click()
    await tag.fill('')
    await tag.press('Enter')
    await pane.getByTestId('rss-settings-toggle').click()
    await expect(items.first().getByTestId('rss-mark')).toHaveText('AN')
  } finally {
    await launched.close()
  }
})

test('LAST SEEN marks where the list stood at the last look, and each look is written as it begins', async () => {
  // Between alpha's second and third stories, by publication time.
  const seenAt = storyAt(0, 1) - 30 * 60_000
  const before = Date.now()
  const launched = await launch(undefined, {
    layout: layout('rss', { feeds: [`${origin}/alpha.xml`], seenAt }),
  })
  try {
    const { page, userData } = launched
    const pane = rssPane(page)
    await expect(pane.getByTestId('rss-item')).toHaveCount(15, { timeout: 20_000 })
    const line = pane.getByTestId('rss-lastseen')
    await expect(line).toHaveCount(1)
    // The line sits in the third story's row, above it.
    await expect(pane.locator('li:has([data-testid=rss-lastseen])')).toContainText('alpha story 3')

    // This look is written as it began, for the next one.
    await waitForSaved(userData, (text) => {
      const match = /"seenAt":\s*(\d+)/.exec(text)
      return match !== null && Number(match[1]) >= before
    })
    // The window put away and back is a new look: every story is older, so the line marks nothing.
    await launched.app.evaluate(({ BrowserWindow }) => {
      for (const win of BrowserWindow.getAllWindows()) win.minimize()
    })
    await expect(page.locator(':root[data-offscreen]')).toHaveCount(1)
    await bringWindowBack(launched.app, page)
    await expect(line).toHaveCount(0)
  } finally {
    await launched.close()
  }
})

test('ASK AI hands the article to the AI chat to send, and TRANSLATE calls the TRANSLATE pane up', async () => {
  const launched = await launch(undefined, {
    layout: layout('rss', { feeds: [`${origin}/alpha.xml`] }),
    // A provider to talk to, so the chat shows its composer; it is never asked anything here.
    settings: aiSettings([openaiProvider(origin)]),
  })
  try {
    const { page } = launched
    const pane = rssPane(page)
    await expect(pane.getByTestId('rss-item')).toHaveCount(15, { timeout: 20_000 })
    await pane.getByTestId('rss-item').nth(0).click()
    await pane.getByTestId('rss-ask').click()

    const popup = page.getByTestId('popup-pane')
    await expect(popup).toHaveAttribute('data-widget', 'aichat')
    const input = popup.getByTestId('aichat-input')
    await expect(input).toHaveValue(
      /alpha story 1\n\nThe first alpha story, in brief\.\n\nhttp:\/\/127\.0\.0\.1:\d+\/alpha\/1$/,
    )
    await expect(input).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(popup).toHaveCount(0)

    await pane.getByTestId('rss-translate').click()
    await expect(popup).toHaveAttribute('data-widget', 'translate')
  } finally {
    await launched.close()
  }
})

test('OPML brings feeds in up to the limit and writes the list out', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-opml-'))
  const opml = path.join(dir, 'in.opml')
  writeFileSync(
    opml,
    `<?xml version="1.0"?><opml version="2.0"><body><outline text="x"><outline text="Alpha" xmlUrl="${origin}/alpha.xml"/><outline text="Beta" xmlUrl="${origin}/beta.atom"/><outline text="bad" xmlUrl="file:///C:/Windows/win.ini"/></outline></body></opml>`,
  )
  const launched = await launch(undefined, {
    layout: layout('rss', { feeds: [`${origin}/alpha.xml`] }),
  })
  try {
    const { app, page } = launched
    const pane = rssPane(page)
    await expect(pane.getByTestId('rss-item')).toHaveCount(15, { timeout: 20_000 })
    await pane.getByTestId('rss-settings-toggle').click()
    await pane.getByTestId('rss-tab-add').click()

    await pickerAnswers(app, opml)
    await pane.getByTestId('rss-opml-import').click()
    await expect(pane.getByTestId('rss-opml-note')).toHaveText('added 1')
    await expect.poll(() => watching(page)).toEqual([ALPHA(), BETA()])

    const out = path.join(dir, 'out.opml')
    const opened = await saveDialogAnswers(app, out)
    await pane.getByTestId('rss-opml-export').click()
    await expect(pane.getByTestId('rss-opml-note')).toHaveText(`saved ${out}`)
    expect(await opened()).toEqual([{ owned: true }])
    const written = readFileSync(out, 'utf8')
    expect(written).toContain(`xmlUrl="${origin}/alpha.xml"`)
    expect(written).toContain(`xmlUrl="${origin}/beta.atom"`)
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
    await expect(pane.getByTestId('pane-subtitle')).toContainText('1 failing')

    // Adding a feed fetches only that one: the feeds already listed are not
    // restarted, so the failing one is not asked again before its retry.
    await pane.getByTestId('rss-settings-toggle').click()
    await pane.getByTestId('rss-tab-add').click()
    requests.length = 0
    await addThroughFind(page, BETA(), BETA())
    await pane.getByTestId('rss-settings-toggle').click()
    await expect(pane.getByTestId('rss-item')).toHaveCount(20, { timeout: 20_000 })
    await quietFor(1000, async () => requests.length, 'the requests')
    expect(requests.map((r) => r.url)).toEqual(['/beta.atom', '/beta.atom'])

    // FEEDS lists each with its state; removing all but the failing one says why it is empty.
    await pane.getByTestId('rss-settings-toggle').click()
    const rows = pane.getByTestId('rss-feed-row')
    await expect(rows).toHaveCount(3)
    await expect(rows.nth(1)).toContainText('stale')
    await rows.nth(2).getByTestId('rss-feed-remove').click()
    await expect(rows).toHaveCount(2)
    await rows.nth(0).getByTestId('rss-feed-remove').click()
    await expect(rows).toHaveCount(1)
    await pane.getByTestId('rss-settings-toggle').click()
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
    await pane.getByTestId('rss-tab-add').click()
    await addThroughFind(page, BETA(), BETA())
    await pane.getByTestId('rss-settings-toggle').click()
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
        story('breaking', BASE + 3_600_000),
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

    // One arriving while CARD is shown is not lit later, when LIST comes back.
    await pane.getByTestId('rss-view-card').click()
    await expect(pane.getByTestId('rss-cards')).toBeVisible()
    const later: FeedUpdate = {
      ...next,
      fetchedAt: Date.now(),
      items: [story('later', BASE + 2 * 3_600_000), ...next.items],
    }
    await app.evaluate(({ BrowserWindow }, payload) => {
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send('feeds:update', payload)
    }, later)
    await expect(items.first()).toContainText('later')
    await pane.getByTestId('rss-view-list').click()
    await expect(items.first()).toContainText('later')
    await expect(fresh).toHaveCount(0)

    // An open article whose headline leaves the feed closes, rather than holding TICKER still.
    await items.first().click()
    await expect(pane.getByTestId('rss-article-title')).toHaveText('later')
    await app.evaluate(({ BrowserWindow }, payload) => {
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send('feeds:update', payload)
    }, next)
    await expect(pane.getByTestId('rss-article')).toHaveCount(0)
    await pane.getByTestId('rss-view-ticker').click()
    const count = pane.getByTestId('rss-ticker-count')
    await expect(count).toHaveText(/^1\/\d+$/)
    // TICKER waits while an article is open; with none open now, it steps on its 6 s beat.
    await expect(count).not.toHaveText(/^1\/\d+$/, { timeout: 9000 })
  } finally {
    await close()
  }
})
