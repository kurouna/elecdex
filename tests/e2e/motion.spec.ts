import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * Entrance and exit effects: the calendar's wave, a new pane's power-on, a closed
 * pane's power-off with its neighbours extending into its room, and all of them
 * staying still with motion reduced. The effects are CSS animations of elements created
 * for them, so what is checked is which elements are created and what animation
 * their computed style gives them - not frames, which would make the tests slow
 * and flaky. The new-row effects of the RSS and quakes panes are in their specs.
 */

const calendarOnly = { version: 1, root: { kind: 'pane', id: 'c', widget: 'calendar' } }
const cells = (page: Page) => page.getByTestId('calendar-day')

/** The computed animation of the first and last cells, and of today's ring. */
const waveStyle = (page: Page) =>
  page.evaluate(() => {
    const days = [...document.querySelectorAll<HTMLElement>('[data-testid=calendar-day]')]
    const style = (el: Element | undefined, pseudo?: string) => {
      if (el === undefined) return null
      const s = getComputedStyle(el, pseudo)
      return { name: s.animationName, duration: s.animationDuration, delay: s.animationDelay }
    }
    return {
      first: style(days[0]),
      last: style(days[41]),
      today: style(document.querySelector('[data-today]') ?? undefined, '::after'),
    }
  })

test('a month comes in as a wave the way the calendar moved, and "today" pings once it arrives', async () => {
  const { page, close } = await launch(undefined, { layout: calendarOnly })
  try {
    const calendar = page.getByTestId('calendar')
    await expect(cells(page)).toHaveCount(42)
    await expect(calendar).toHaveAttribute('data-wave', 'next')
    let style = await waveStyle(page)
    expect(style.first).toMatchObject({ duration: '0.42s', delay: '0s' })
    expect(style.first?.name).toMatch(/day-in/)
    // The last cell is 11 diagonals on, at 22 ms each.
    expect(style.last?.delay).toBe('0.242s')
    expect(style.today?.name).toMatch(/today-ping/)

    // Each change of month makes new cells, which replay the wave from its side.
    const marked = () =>
      page.evaluate(() => {
        const first = document.querySelector('[data-testid=calendar-day]') as HTMLElement
        first.dataset.probe = 'old'
      })
    const stillThere = () => page.locator('[data-probe=old]').count()
    await marked()
    await page.getByTestId('calendar-prev').click()
    await expect(calendar).toHaveAttribute('data-wave', 'prev')
    expect(await stillThere()).toBe(0)
    style = await waveStyle(page)
    expect([style.first?.delay, style.last?.delay]).toEqual(['0.242s', '0s'])

    await marked()
    await page.getByTestId('calendar-today').click()
    await expect(calendar).toHaveAttribute('data-wave', 'next')
    expect(await stillThere()).toBe(0)

    // "today" on the month already shown changes nothing, so replays nothing.
    await marked()
    await page.getByTestId('calendar-today').click()
    expect(await stillThere()).toBe(1)
  } finally {
    await close()
  }
})

test('a pane added from the picker powers on once', async () => {
  const { page, close } = await launch(undefined, { layout: calendarOnly })
  try {
    const existing = page.locator('[data-testid=pane][data-widget=calendar]')
    await expect(existing).toHaveCount(1)
    await page.keyboard.press('Control+Shift+KeyA')
    await page.locator('[data-testid=pane-picker-item][data-widget=clock]').click()
    const added = page.locator('[data-testid=pane][data-widget=clock]')
    await expect(added).toHaveClass(/crt-on/)
    await expect(added).toHaveCSS('--crt-duration', '520ms')
    // The pane already there does not power on again.
    await expect(existing).not.toHaveClass(/crt-on/)
    // Once played, the class goes, and with it the layer it asks the GPU for.
    await expect(added).not.toHaveClass(/crt-on/, { timeout: 3000 })
    await expect(added).toHaveCSS('will-change', 'auto')
  } finally {
    await close()
  }
})

const paneNode = (id: string, widget: string) => ({ kind: 'pane', id, widget })
const byId = (page: Page, id: string) => page.locator(`[data-testid=pane][data-pane-id="${id}"]`)

interface Effects {
  /** Each effect class a pane was given, as "id:class". */
  seen: Set<string>
  /** For each pane that extended: its animation and where its clip started on the left. */
  extended: Record<string, { animation: string; fromLeft: string }>
}

/**
 * Starts recording the effects panes are given: an extension lasts 220 ms, shorter
 * than a poll between two assertions may take, so it is caught as it is applied.
 */
const recordEffects = (page: Page) =>
  page.evaluate(() => {
    const effects: Effects = { seen: new Set(), extended: {} }
    ;(window as unknown as { effects: Effects }).effects = effects
    const note = (el: HTMLElement) => {
      const id = el.dataset.paneId as string
      const names = [...el.classList].filter((name) => name.startsWith('crt-'))
      for (const name of names) effects.seen.add(`${id}:${name}`)
      if (!names.includes('crt-extend')) return
      effects.extended[id] = {
        animation: getComputedStyle(el).animationName,
        fromLeft: el.style.getPropertyValue('--from-left'),
      }
    }
    // A class change on a pane, or a pane mounted (a remount comes with its classes).
    const panesIn = (node: Node): HTMLElement[] =>
      node instanceof HTMLElement
        ? [node, ...node.querySelectorAll<HTMLElement>('*')].filter(
            (el) => el.dataset.testid === 'pane',
          )
        : []
    new MutationObserver((records) => {
      const touched = records.flatMap((r) => [r.target, ...r.addedNodes].flatMap(panesIn))
      for (const el of touched) note(el)
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
    })
  })

const effectsSeen = (page: Page) =>
  page.evaluate(() => [...(window as unknown as { effects: Effects }).effects.seen].sort())

/** Clicks each pane's close button in one task, so the closes overlap for certain. */
const closeAtOnce = (page: Page, ids: string[]) =>
  page.evaluate((list) => {
    for (const id of list) {
      document
        .querySelector<HTMLElement>(`[data-pane-id="${id}"] [data-testid=pane-close]`)
        ?.click()
    }
  }, ids)

/** Whether `pane` is still in the page a frame after clicking `button`, once Svelte has applied it. */
const stillThereAfter = (page: Page, button: string, pane: string) =>
  page.evaluate(
    async ({ button, pane }) => {
      document.querySelector<HTMLElement>(button)?.click()
      await new Promise((resolve) => requestAnimationFrame(resolve))
      return document.querySelector(pane) !== null
    },
    { button, pane },
  )

test('a closed pane powers off before it goes, and the shell beside it extends with one resize', async () => {
  const layout = {
    version: 1,
    root: {
      kind: 'split',
      id: 's',
      direction: 'row',
      sizes: [0.5, 0.5],
      children: [paneNode('c', 'clock'), paneNode('term', 'terminal')],
    },
  }
  const { page, close } = await launch(undefined, { layout })
  try {
    const clock = byId(page, 'c')
    const shell = byId(page, 'term')
    await expect(shell.getByTestId('terminal-host')).toBeVisible()
    // Every width the shell's host takes: a fit per frame would garble the shell's history.
    await page.evaluate(() => {
      const host = document.querySelector('[data-pane-id=term] [data-testid=terminal-host]')
      const widths: number[] = []
      ;(window as unknown as { widths: number[] }).widths = widths
      new ResizeObserver(([entry]) => {
        if (entry) widths.push(Math.round(entry.contentRect.width))
      }).observe(host as Element)
    })

    await recordEffects(page)
    await clock.getByTestId('pane-close').click()
    await expect(clock).toHaveClass(/crt-off/)
    await expect(clock).toHaveClass(/crt-beam/)
    await expect(clock).toHaveAttribute('inert', '')
    await expect(clock).toHaveCSS('animation-name', 'crt-power-off')
    await expect(clock).toHaveCSS('--crt-duration', '300ms')
    // Focus has already moved on.
    await expect(shell).toHaveClass(/focused/)

    await expect(clock).toHaveCount(0)
    await expect(shell).not.toHaveClass(/crt-extend/)
    await expect(shell).toHaveCSS('will-change', 'auto')
    expect(await effectsSeen(page)).toEqual(['c:crt-beam', 'c:crt-off', 'term:crt-extend'])
    // The shell took the clock's half: its clip started at its old left edge.
    const extended = await page.evaluate(
      () => (window as unknown as { effects: Effects }).effects.extended.term,
    )
    expect(extended?.animation).toBe('crt-extend')
    expect(Number.parseInt(extended?.fromLeft ?? '', 10)).toBeGreaterThan(100)

    const widths = await page.evaluate(() => (window as unknown as { widths: number[] }).widths)
    expect(new Set(widths).size).toBe(2)
  } finally {
    await close()
  }
})

test('closing panes in quick succession leaves the tree and the page in step', async () => {
  const layout = {
    version: 1,
    root: {
      kind: 'split',
      id: 'row',
      direction: 'row',
      sizes: [0.5, 0.5],
      children: [
        paneNode('a', 'clock'),
        {
          kind: 'split',
          id: 'col',
          direction: 'column',
          sizes: [0.5, 0.5],
          children: [paneNode('b', 'calendar'), paneNode('c', 'sysinfo')],
        },
      ],
    },
  }
  const { page, userData, close } = await launch(undefined, { layout })
  try {
    await expect(byId(page, 'c')).toHaveCount(1)
    // Closing b collapses the column: c moves up a level and remounts while b would still be going.
    await recordEffects(page)
    await closeAtOnce(page, ['b', 'c'])
    await expect(byId(page, 'b')).toHaveCount(0)
    await expect(byId(page, 'c')).toHaveCount(0)
    await expect(page.getByTestId('pane')).toHaveCount(1)
    await expect(page.locator('.crt-off, .crt-extend')).toHaveCount(0)
    // b went at once when c began to close; only c powered off, and a took the room.
    expect(await effectsSeen(page)).toEqual(['a:crt-extend', 'c:crt-beam', 'c:crt-off'])
    await expect
      .poll(() => {
        const saved = path.join(userData, 'layout.json')
        return existsSync(saved) ? JSON.parse(readFileSync(saved, 'utf8')).root : null
      })
      .toEqual(paneNode('a', 'clock'))
  } finally {
    await close()
  }
})

test('a tab behind another closes at once, the shown one powers off', async () => {
  const layout = {
    version: 1,
    root: {
      kind: 'tabs',
      id: 'g',
      activeIndex: 0,
      children: [
        paneNode('front', 'clock'),
        paneNode('back', 'calendar'),
        paneNode('third', 'sysinfo'),
      ],
    },
  }
  const { page, close } = await launch(undefined, { layout })
  try {
    await expect(byId(page, 'front')).toHaveCount(1)
    expect(
      await stillThereAfter(
        page,
        '[data-testid=tab-close][data-pane-id=back]',
        '[data-testid=pane][data-pane-id=back]',
      ),
    ).toBe(false)
    await recordEffects(page)
    await page.locator('[data-testid=tab-close][data-pane-id=front]').click()
    await expect(byId(page, 'front')).toHaveClass(/crt-off/)
    await expect(byId(page, 'front')).toHaveCount(0)
    // The tab that takes its place is a pane of its own now, opening from a line across it.
    await expect(page.getByTestId('tabs-host')).toHaveCount(0)
    await expect(page.locator('.crt-off, .crt-extend')).toHaveCount(0)
    expect(await effectsSeen(page)).toEqual(['front:crt-beam', 'front:crt-off', 'third:crt-extend'])
  } finally {
    await close()
  }
})

test('with motion reduced, nothing moves: the wave ends before it begins, a new pane just appears and a closed one just goes', async () => {
  const { page, close } = await launch(undefined, {
    layout: calendarOnly,
    settings: { sound: { enabled: false }, motion: 'reduced' },
  })
  try {
    await expect(cells(page)).toHaveCount(42)
    const style = await waveStyle(page)
    expect(style.first?.duration).toBe('0s')
    expect(style.last?.delay).toBe('0s')
    expect(style.today?.duration).toBe('0s')

    await page.keyboard.press('Control+Shift+KeyA')
    await page.locator('[data-testid=pane-picker-item][data-widget=clock]').click()
    const added = page.locator('[data-testid=pane][data-widget=clock]')
    await expect(added).toHaveCount(1)
    await expect(added).not.toHaveClass(/crt-on/)

    // And a closed pane just goes.
    const clock = '[data-testid=pane][data-widget=clock]'
    expect(await stillThereAfter(page, `${clock} [data-testid=pane-close]`, clock)).toBe(false)
    await expect(page.locator('.crt-off, .crt-extend')).toHaveCount(0)
  } finally {
    await close()
  }
})
