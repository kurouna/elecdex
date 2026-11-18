import type { FeedUpdate } from '@shared/feeds'
import { cleanup, fireEvent, render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { inertDom } from './support/dom.ts'
import { stubElecdex } from './support/elecdex.ts'
import { settle } from './support/settle.ts'

const { default: RssWidget } = await import('../../src/renderer/widgets/rss/RssWidget.svelte')
const { windowState } = await import('../../src/renderer/stores/window-state.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')

/**
 * The RSS pane against a stand-in main: what a review of the rework found (2026-11-15) and the
 * behaviour around it - the article keeps the keyboard when another headline is picked, the
 * "n new" pill does not outlive the list it counted for, the settings icon is not offered where
 * it does nothing, and the settings' fields say what they did not take.
 */

const A = 'https://a.test/feed'
const B = 'https://b.test/feed'
const HOUR = 3_600_000
const NOW = new Date(2026, 10, 15, 12).getTime()

const feed = (
  url: string,
  title: string,
  count: number,
  extra: Partial<FeedUpdate> = {},
): FeedUpdate => ({
  url,
  title,
  items: Array.from({ length: count }, (_, i) => ({
    title: `${title} ${i + 1}`,
    link: `${url}/${i + 1}`,
    at: NOW - (i + (url === B ? 0.5 : 0)) * HOUR,
  })),
  fetchedAt: NOW,
  error: null,
  ...extra,
})

let handlers: Map<string, (u: FeedUpdate) => void>
/** What each feed last was, so a read mark comes back as main sends it: the feed again. */
let last: Map<string, FeedUpdate>
let marked: Array<[string, string, boolean]>
let markedAll: Array<Array<{ feed: string; key: string }>>

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  windowState.onScreen = true
  // The press's three beats and the list's motion go at once: what is tested is what follows.
  ;(appearance.settings as { motion: string }).motion = 'reduced'
  inertDom()
  handlers = new Map()
  last = new Map()
  marked = []
  // jsdom has no Web Animations; the list's flip asks for them as rows move.
  Element.prototype.getAnimations ??= () => []
  markedAll = []
  stubElecdex({
    feeds: {
      subscribe: (url: string, handler: (u: FeedUpdate) => void) => {
        handlers.set(url, handler)
        return () => handlers.delete(url)
      },
      image: async () => null,
      markRead: async (feed: string, key: string, read: boolean) => {
        marked.push([feed, key, read])
        const update = last.get(feed)
        if (update !== undefined) {
          const keys = new Set(update.read ?? [])
          if (read) keys.add(key)
          else keys.delete(key)
          queueMicrotask(() => void send({ ...update, read: [...keys] }))
        }
        return true
      },
      markAllRead: async (entries: Array<{ feed: string; key: string }>) => {
        markedAll.push(entries)
        return true
      },
    },
    system: { openExternal: async () => {} },
  })
})

afterEach(async () => {
  cleanup()
  windowState.onScreen = true
  await layout.flush()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function mount(state: Record<string, unknown>) {
  const view = render(RssWidget, {
    props: { paneId: 'r1', title: 'rss', props: {}, state, active: true, visible: true },
  })
  await settle()
  return view
}

async function send(update: FeedUpdate): Promise<void> {
  last.set(update.url, update)
  handlers.get(update.url)?.(structuredClone(update))
  await settle()
}

const items = (root: HTMLElement) => [
  ...root.querySelectorAll<HTMLElement>('[data-testid=rss-item]'),
]
const byId = (root: HTMLElement, id: string) =>
  root.querySelector<HTMLElement>(`[data-testid=${id}]`)

describe('RssWidget', () => {
  it('offers no settings icon with no feeds, where the settings are the pane itself', async () => {
    const view = await mount({})
    expect(byId(view.container, 'rss-empty')).not.toBeNull()
    expect(byId(view.container, 'rss-settings-toggle')).toBeNull()
    await view.rerender({ state: { feeds: [A] } })
    await settle()
    expect(byId(view.container, 'rss-settings-toggle')).not.toBeNull()
  })

  it('gives the keyboard to the article again when another headline is picked from the list', async () => {
    const view = await mount({ feeds: [A] })
    await send(feed(A, 'alpha', 5))
    await fireEvent.click(items(view.container)[0] as HTMLElement)
    await settle()
    const first = byId(view.container, 'rss-article')
    expect(document.activeElement).toBe(first)

    // Picked with the article open, the second headline's article has the keyboard (and so
    // Escape) - not the row clicked, where Escape would close the popup or the zoom.
    const second = items(view.container)[1] as HTMLElement
    second.focus()
    await fireEvent.click(second)
    await settle()
    expect(byId(view.container, 'rss-article-title')?.textContent).toBe('alpha 2')
    expect(document.activeElement).toBe(byId(view.container, 'rss-article'))
  })

  it('steps to the next or previous headline with the arrow keys in the article', async () => {
    const view = await mount({ feeds: [A] })
    await send(feed(A, 'alpha', 3))
    await fireEvent.click(items(view.container)[1] as HTMLElement)
    await settle()
    await fireEvent.keyDown(byId(view.container, 'rss-article') as HTMLElement, {
      key: 'ArrowDown',
    })
    await settle()
    expect(byId(view.container, 'rss-article-title')?.textContent).toBe('alpha 3')
    await fireEvent.keyDown(byId(view.container, 'rss-article') as HTMLElement, {
      key: 'ArrowDown',
    })
    await settle()
    expect(byId(view.container, 'rss-article-title')?.textContent).toBe('alpha 3')
    await fireEvent.keyDown(byId(view.container, 'rss-article') as HTMLElement, { key: 'ArrowUp' })
    await fireEvent.keyDown(byId(view.container, 'rss-article') as HTMLElement, { key: 'ArrowUp' })
    await settle()
    expect(byId(view.container, 'rss-article-title')?.textContent).toBe('alpha 1')
    // Each article opened by the keys is read, as one opened by a click.
    expect(marked.map(([, key]) => key)).toEqual([`${A}/2`, `${A}/3`, `${A}/1`])
    expect(document.activeElement).toBe(byId(view.container, 'rss-article'))
  })

  it('lets the "n new" pill go with the list it counted for', async () => {
    const view = await mount({ feeds: [A] })
    await send(feed(A, 'alpha', 10))
    const list = byId(view.container, 'rss-items') as HTMLElement
    list.scrollTop = 200
    await send({
      ...feed(A, 'alpha', 10),
      items: [{ title: 'new', link: `${A}/new`, at: NOW + HOUR }, ...feed(A, 'alpha', 10).items],
    })
    expect(byId(view.container, 'rss-new')?.textContent).toMatch(/1 new/)

    // To CARD and back: LIST starts at its top again, so nothing is waiting above it.
    await fireEvent.click(byId(view.container, 'rss-view-card') as HTMLElement)
    await settle()
    await view.rerender({ state: { feeds: [A], view: 'card' } })
    await settle()
    await view.rerender({ state: { feeds: [A] } })
    await settle()
    expect(byId(view.container, 'rss-new')).toBeNull()
  })

  it('lets the pill go behind the settings too', async () => {
    const view = await mount({ feeds: [A] })
    await send(feed(A, 'alpha', 10))
    ;(byId(view.container, 'rss-items') as HTMLElement).scrollTop = 200
    await send({
      ...feed(A, 'alpha', 10),
      items: [{ title: 'new', link: `${A}/new`, at: NOW + HOUR }, ...feed(A, 'alpha', 10).items],
    })
    expect(byId(view.container, 'rss-new')).not.toBeNull()
    await fireEvent.click(byId(view.container, 'rss-settings-toggle') as HTMLElement)
    await settle()
    await fireEvent.click(byId(view.container, 'rss-settings-toggle') as HTMLElement)
    await settle()
    expect(byId(view.container, 'rss-items')).not.toBeNull()
    expect(byId(view.container, 'rss-new')).toBeNull()
  })

  it('draws a read headline in TICKER as LIST and CARD do', async () => {
    const view = await mount({ feeds: [A], view: 'ticker' })
    await send(feed(A, 'alpha', 3, { read: [`${A}/1`] }))
    expect(byId(view.container, 'rss-mark')?.classList.contains('read')).toBe(true)
  })

  it('marks CARD’s chosen card as the current one, as LIST does', async () => {
    const view = await mount({ feeds: [A], view: 'card' })
    await send(feed(A, 'alpha', 3))
    await fireEvent.click(items(view.container)[1] as HTMLElement)
    await settle()
    expect(items(view.container)[1]?.getAttribute('aria-current')).toBe('true')
    expect(items(view.container)[0]?.hasAttribute('aria-current')).toBe(false)
  })

  it('says why a feed fails on its lamp', async () => {
    const view = await mount({ feeds: [A, B] })
    await send(feed(A, 'alpha', 2))
    await send({ ...feed(B, 'beta', 0), fetchedAt: null, error: 'HTTP 503' })
    const lamps = [...view.container.querySelectorAll('[data-testid=rss-lamps] i')]
    expect(lamps[1]?.getAttribute('title')).toBe('beta - HTTP 503')
  })

  it('shows only the unread when asked, and marks every shown headline read at once', async () => {
    const view = await mount({ feeds: [A] })
    await send(feed(A, 'alpha', 4, { read: [`${A}/2`] }))
    await fireEvent.click(byId(view.container, 'rss-unread-only') as HTMLElement)
    await settle()
    await view.rerender({ state: { feeds: [A], unreadOnly: true } })
    await settle()
    expect(items(view.container).map((i) => i.textContent)).not.toContain('alpha 2')
    expect(items(view.container)).toHaveLength(3)

    await fireEvent.click(byId(view.container, 'rss-mark-all-read') as HTMLElement)
    await settle()
    expect(markedAll).toEqual([[`${A}/1`, `${A}/3`, `${A}/4`].map((key) => ({ feed: A, key }))])
  })

  it('offers MARK ALL READ only while the list as shown has an unread headline', async () => {
    const view = await mount({ feeds: [A, B] })
    await send(feed(A, 'alpha', 2))
    await send(feed(B, 'beta', 2, { read: [`${B}/1`, `${B}/2`] }))
    const button = byId(view.container, 'rss-mark-all-read') as HTMLButtonElement
    expect(button.disabled).toBe(false)
    // Narrowed to the feed read through, the button pressed and did nothing (found in review).
    const chip = view.container.querySelector<HTMLElement>(
      `[data-testid=rss-chip][data-feed="${B}"]`,
    )
    await fireEvent.click(chip as HTMLElement)
    await settle()
    expect(button.disabled).toBe(true)
    // So with a search that leaves only read headlines.
    await fireEvent.click(byId(view.container, 'rss-chip') as HTMLElement)
    await settle()
    expect(button.disabled).toBe(false)
    await fireEvent.input(byId(view.container, 'rss-search') as HTMLElement, {
      target: { value: 'beta' },
    })
    await settle()
    expect(button.disabled).toBe(true)
  })

  it('closes the article as the view changes, so no other view keeps it open', async () => {
    const view = await mount({ feeds: [A] })
    await send(feed(A, 'alpha', 3))
    await fireEvent.click(items(view.container)[0] as HTMLElement)
    await settle()
    expect(byId(view.container, 'rss-article')).not.toBeNull()
    // Left open, its way back was a row of the view gone, and TICKER stood still under it
    // (found in review).
    await fireEvent.click(byId(view.container, 'rss-view-card') as HTMLElement)
    await settle()
    expect(byId(view.container, 'rss-article')).toBeNull()
  })

  it('empties the find box with Escape, and owns Escape only while there is a search', async () => {
    const view = await mount({ feeds: [A] })
    await send(feed(A, 'alpha', 3))
    const box = byId(view.container, 'rss-search') as HTMLInputElement
    expect(box.hasAttribute('data-owns-escape')).toBe(false)
    await fireEvent.input(box, { target: { value: 'alpha 2' } })
    await settle()
    expect(box.hasAttribute('data-owns-escape')).toBe(true)
    await fireEvent.keyDown(box, { key: 'Escape' })
    await settle()
    expect(box.value).toBe('')
    expect(box.hasAttribute('data-owns-escape')).toBe(false)
    expect(items(view.container)).toHaveLength(3)
  })

  it('keeps the find box while a search narrows the list, however narrow the pane', async () => {
    const view = await mount({ feeds: [A] })
    await send(feed(A, 'alpha', 3))
    const box = byId(view.container, 'rss-search') as HTMLInputElement
    expect(box.classList.contains('active')).toBe(false)
    await fireEvent.input(box, { target: { value: 'alpha 2' } })
    await settle()
    expect(box.classList.contains('active')).toBe(true)
    await fireEvent.click(byId(view.container, 'rss-search-clear') as HTMLElement)
    await settle()
    expect(box.value).toBe('')
    expect(items(view.container)).toHaveLength(3)
  })
})

describe('RssWidget settings', () => {
  async function openTab(container: HTMLElement, tab: string) {
    await fireEvent.click(byId(container, 'rss-settings-toggle') as HTMLElement)
    await settle()
    await fireEvent.click(byId(container, `rss-tab-${tab}`) as HTMLElement)
    await settle()
  }

  it('clears a tag of spaces from its field instead of leaving them there', async () => {
    const view = await mount({ feeds: [A] })
    await send(feed(A, 'alpha', 1))
    await openTab(view.container, 'feeds')
    const tag = byId(view.container, 'rss-tag') as HTMLInputElement
    tag.value = '   '
    await fireEvent.change(tag)
    await settle()
    expect(tag.value).toBe('')
  })

  it('closes up the spaces in a keyword and leaves its letters alone', async () => {
    // The spaces were closed up with /s+/, which took the letter s: "rss" was "r " (found in
    // review). With "rss" listed, typing it again is a repeat only if it stays "rss".
    const view = await mount({ feeds: [A], mute: ['rss', 'deep space'] })
    await send(feed(A, 'alpha', 1))
    await openTab(view.container, 'keywords')
    const input = byId(view.container, 'rss-word-input-mute') as HTMLInputElement
    input.value = 'rss'
    await fireEvent.input(input)
    await fireEvent.submit(input.closest('form') as HTMLFormElement)
    await settle()
    expect(byId(view.container, 'rss-word-note-mute')?.textContent).toMatch(
      /"rss" is already listed/,
    )
    input.value = '  deep \t  space '
    await fireEvent.input(input)
    await fireEvent.submit(input.closest('form') as HTMLFormElement)
    await settle()
    expect(byId(view.container, 'rss-word-note-mute')?.textContent).toMatch(
      /"deep space" is already listed/,
    )
  })

  it('says why a keyword was not taken: too long, a repeat, or the list full', async () => {
    const view = await mount({ feeds: [A], mute: Array.from({ length: 19 }, (_, i) => `w${i}`) })
    await send(feed(A, 'alpha', 1))
    await openTab(view.container, 'keywords')
    const input = byId(view.container, 'rss-word-input-mute') as HTMLInputElement
    expect(input.maxLength).toBe(40)
    input.value = 'W3'
    await fireEvent.input(input)
    await fireEvent.submit(input.closest('form') as HTMLFormElement)
    await settle()
    expect(byId(view.container, 'rss-word-note-mute')?.textContent).toMatch(/already listed/)
    input.value = 'x'.repeat(41)
    await fireEvent.input(input)
    await fireEvent.submit(input.closest('form') as HTMLFormElement)
    await settle()
    expect(byId(view.container, 'rss-word-note-mute')?.textContent).toMatch(/40 characters/)
  })
})
