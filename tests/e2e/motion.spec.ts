import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch, removeDir } from './support.js'

/**
 * Entrance and exit effects: the calendar's wave, a new pane's power-on, a closed
 * pane's power-off with its neighbours extending into its room, and all of them
 * staying still with motion reduced. The effects are CSS animations of elements created
 * for them, so what is checked is which elements are created and what animation
 * their computed style gives them - not frames, which would make the tests slow
 * and flaky. The new-row effects of the RSS and quakes panes are in their specs.
 */

const calendarOnly = { version: 1, root: { kind: 'pane', id: 'c', widget: 'calendar' } }
/**
 * The month on screen. A pane this size shows the months either side of it as
 * well (tools.spec covers that); the wave is the same in each, so it is read
 * from the one in the middle.
 */
const CURRENT = '[data-testid=calendar-grid][data-current]'
const cells = (page: Page) => page.locator(`${CURRENT} [data-testid=calendar-day]`)

/** The computed animation of the first and last cells, and of today's ring. */
const waveStyle = (page: Page) =>
  page.evaluate((current) => {
    const days = [
      ...document.querySelectorAll<HTMLElement>(`${current} [data-testid=calendar-day]`),
    ]
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
  }, CURRENT)

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
      page.evaluate((current) => {
        const first = document.querySelector(`${current} [data-testid=calendar-day]`) as HTMLElement
        first.dataset.probe = 'old'
      }, CURRENT)
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

/** Starts counting the power-ons panes play, by widget, from here on. */
const recordPowerOns = (page: Page) =>
  page.evaluate(() => {
    const played: string[] = []
    ;(window as unknown as { powerOns: string[] }).powerOns = played
    document.addEventListener(
      'animationstart',
      (event) => {
        const el = event.target as HTMLElement
        if (event.animationName === 'crt-power-on' && el.dataset.testid === 'pane')
          played.push(el.dataset.widget ?? '')
      },
      true,
    )
  })

const powerOns = (page: Page) =>
  page.evaluate(() => (window as unknown as { powerOns: string[] }).powerOns)

test('a new tab put behind another before it has powered on does not power on again when shown', async () => {
  const layout = {
    version: 1,
    root: {
      kind: 'tabs',
      id: 'g',
      activeIndex: 0,
      children: [paneNode('a', 'calendar'), paneNode('b', 'sysinfo')],
    },
  }
  const { page, close } = await launch(undefined, { layout })
  try {
    await expect(page.getByTestId('tab')).toHaveCount(2)
    await recordPowerOns(page)
    // Two new tabs within the first one's power-on: it is display:none before it
    // has played, which cancels the animation without an event to say so.
    await page.evaluate(async () => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
      document.querySelector<HTMLElement>('[data-testid=tab-new]')?.click()
      await frame()
      await frame()
      document.querySelector<HTMLElement>('[data-testid=tab-new]')?.click()
    })
    await expect(page.getByTestId('tab')).toHaveCount(4)
    await expect(page.locator('[data-testid=pane].crt-on')).toHaveCount(0, { timeout: 3000 })
    // One or two by now: the first tab may be hidden before its animation has started.
    const played = await powerOns(page)
    expect(played.length).toBeGreaterThanOrEqual(1)

    await page.getByTestId('tab').nth(2).click()
    await page.waitForTimeout(700)
    expect(await powerOns(page)).toEqual(played)
  } finally {
    await close()
  }
})

test('a new pane brought forward before it has powered on does not power on again in front', async () => {
  const { page, close } = await launch(undefined, { layout: calendarOnly })
  try {
    await recordPowerOns(page)
    await page.keyboard.press('Control+Shift+KeyA')
    await page.locator('[data-testid=pane-picker-item][data-widget=notes]').click()
    // Within the power-on: the flight replaces its animation, so it never ends.
    await page.evaluate(async () => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
      for (let i = 0; i < 6; i++) await frame()
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          key: 'Z',
          code: 'KeyZ',
          ctrlKey: true,
          shiftKey: true,
        }),
      )
    })
    await expect(page.locator('[data-testid=pane].zoomed')).toHaveCount(1)
    await page.waitForTimeout(1200)
    expect(await powerOns(page)).toEqual(['notes'])
    await expect(page.locator('[data-testid=pane].zoomed')).not.toHaveClass(/crt-on/)
  } finally {
    await close()
  }
})

/** What an element goes on asking of the compositor: its `will-change`, and animations still in effect. */
const heldBy = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => ({
    willChange: getComputedStyle(el).willChange,
    animations: el.getAnimations({ subtree: true }).map((animation) => {
      const effect = animation.effect as KeyframeEffect | null
      return `${(animation as CSSAnimation).animationName}${effect?.pseudoElement ?? ''}`
    }),
  }))

test('what keeps its power-on class holds nothing once it has played: a note, a toast', async () => {
  // A pane loses the class when it has powered on; a note's sheet, a toast, a
  // dialog keep it for as long as they show. The class asked for a layer
  // (will-change) and its beam and scanlines filled forwards, so each kept three
  // layers for good - a note's for as long as the pane was open.
  const layout = {
    version: 1,
    root: {
      kind: 'split',
      id: 's',
      direction: 'row',
      sizes: [0.5, 0.5],
      children: [
        paneNode('n', 'notes'),
        { ...paneNode('t', 'timer'), state: { mode: 'timer', durationMs: 1000 } },
      ],
    },
  }
  const { page, close } = await launch(undefined, {
    layout,
    settings: { sound: { enabled: false }, motion: 'full' },
  })
  try {
    const sheet = '[data-widget=notes] .body.crt-on'
    await expect(page.locator(sheet)).toHaveCount(1)
    await expect
      .poll(() => heldBy(page, sheet), { timeout: 5000 })
      .toEqual({
        willChange: 'auto',
        animations: [],
      })

    await page.getByTestId('timer-start').click()
    await expect(page.getByTestId('toast')).toHaveCount(1, { timeout: 15_000 })
    // The fuse burning down the card's edge is the toast's own, and still running.
    await expect
      .poll(async () => {
        const held = await heldBy(page, '[data-testid=toast]')
        return { ...held, animations: held.animations.filter((name) => !/burn/.test(name)) }
      })
      .toEqual({ willChange: 'auto', animations: [] })
  } finally {
    await close()
  }
})

test('an animation that never ends stops while the window is put away', async () => {
  const layout = {
    version: 1,
    root: { ...paneNode('t', 'timer'), state: { mode: 'timer', durationMs: 9000 } },
  }
  const { app, page, close } = await launch(undefined, { layout })
  try {
    await page.getByTestId('timer-start').click()
    // Under ten seconds the ladder pulses, for as long as the countdown runs.
    const endless = () =>
      page.evaluate(() =>
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY,
          )
          .map((animation) => animation.playState),
      )
    await expect.poll(endless).toEqual(['running'])
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()
        .find((win) => win.isVisible())
        ?.minimize(),
    )
    await expect(page.locator(':root[data-offscreen]')).toHaveCount(1)
    expect(await endless()).toEqual(['paused'])
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()
        .find((win) => win.isMinimized())
        ?.restore(),
    )
    await expect(page.locator(':root[data-offscreen]')).toHaveCount(0)
    // Going again - unless the countdown has landed meanwhile, on a slow machine.
    expect((await endless()).every((state) => state === 'running')).toBe(true)
  } finally {
    await close()
  }
})

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

/** Unscaled: `none` once a power-on has ended, the identity matrix after a cancelled power-off. */
const WHOLE = /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/

const ESCAPE = { key: 'Escape', code: 'Escape' }
const ADD_PANE = { key: 'A', code: 'KeyA', ctrlKey: true, shiftKey: true }
const SETTINGS = { key: '>', code: 'Period', ctrlKey: true, shiftKey: true }

interface DialogState {
  present: boolean
  inert: boolean
  beam: boolean
  /** Whether the dialog's closing beam is playing now, not merely left from an earlier close. */
  beamRunning: boolean
  backdropInert: boolean
  backdropZ: string
  backdropBackground: string
  delay: string
}

/**
 * Presses `keys` one after another within a single task, each given a frame to
 * take effect, and then describes the dialog `selector` finds: a close lasts
 * 300 ms, too short to catch reliably between separate Playwright calls.
 */
/** A key press as the workspace reads it: the key, its code and the modifiers held. */
interface Key {
  key: string
  code: string
  ctrlKey?: boolean
  shiftKey?: boolean
}

const keysThen = (page: Page, keys: Key[], selector: string) =>
  page.evaluate(
    async ({ keys, selector }): Promise<DialogState> => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
      for (const init of keys) {
        window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }))
        await frame()
      }
      const dialog = document.querySelector<HTMLElement>(selector)
      const backdrop = dialog?.parentElement
      return {
        present: dialog !== null,
        inert: dialog?.inert ?? false,
        beam: dialog?.classList.contains('crt-beam') ?? false,
        beamRunning: document.getAnimations().some((a) => {
          const effect = a.effect as KeyframeEffect | null
          return (
            effect?.target === dialog &&
            effect?.pseudoElement === '::after' &&
            (a as CSSAnimation).animationName === 'crt-beam-off' &&
            a.playState === 'running'
          )
        }),
        backdropInert: backdrop?.inert ?? false,
        backdropZ: backdrop?.style.zIndex ?? '',
        backdropBackground: backdrop?.style.background ?? '',
        delay: dialog?.style.getPropertyValue('--crt-delay') ?? '',
      }
    },
    { keys, selector },
  )

test('a dialog powers off as it closes: the pane picker, the settings, the layouts and the weather location', async () => {
  const { page, close } = await launch(undefined, {
    layout: { version: 1, root: paneNode('w', 'weather') },
  })
  try {
    const dialogs = [
      { testid: 'pane-picker', open: () => page.keyboard.press('Control+Shift+KeyA') },
      { testid: 'settings-dialog', open: () => page.keyboard.press('Control+Shift+Period') },
      { testid: 'layouts-dialog', open: () => page.keyboard.press('Control+Shift+KeyG') },
      {
        testid: 'location-picker',
        open: async () => {
          const weather = byId(page, 'w')
          if (!(await weather.getByTestId('weather-location').isVisible())) {
            await weather.getByTestId('weather-settings-toggle').click()
          }
          await weather.getByTestId('weather-location').click()
        },
      },
    ]
    for (const { testid, open } of dialogs) {
      await open()
      const dialog = page.getByTestId(testid)
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveCSS('animation-name', 'crt-power-on')
      const closing = await keysThen(page, [ESCAPE], `[data-testid=${testid}]`)
      // Still there, powering off, and out of the way of the page below.
      expect(closing, testid).toMatchObject({
        present: true,
        inert: true,
        beam: true,
        beamRunning: true,
        backdropInert: true,
      })
      expect(closing.backdropZ, testid).toBe('')
      await expect(dialog).toHaveCount(0)
    }
  } finally {
    await close()
  }
})

test('a dialog opened again while closing comes back whole, and another opens out of its line', async () => {
  const { page, close } = await launch(undefined, { layout: calendarOnly })
  try {
    const picker = page.getByTestId('pane-picker')
    await page.keyboard.press('Control+Shift+KeyA')
    await expect(picker).toBeVisible()
    const reopened = await keysThen(page, [ESCAPE, ADD_PANE], '[data-testid=pane-picker]')
    expect(reopened).toMatchObject({ present: true, inert: false, backdropInert: false })
    await page.waitForTimeout(600)
    await expect(picker).toHaveCount(1)
    await expect(picker).toHaveCSS('opacity', '1')
    await expect(picker).toHaveCSS('transform', WHOLE)
    await expect(page.locator('[data-testid=pane-picker] input').first()).toBeFocused()
    // Its spent beam is gone with the close, and with it the layer it held.
    await expect(picker).not.toHaveClass(/crt-beam/)

    // Closing that same picker and asking for the settings: it powers off again,
    // beam and all, above a clear backdrop, and the settings open out of its line.
    const handing = await keysThen(page, [ESCAPE, SETTINGS], '[data-testid=pane-picker]')
    expect(handing).toMatchObject({
      present: true,
      inert: true,
      beamRunning: true,
      backdropZ: '901',
    })
    expect(handing.backdropBackground).toContain('transparent')
    const settings = page.getByTestId('settings-dialog')
    await expect(settings).toBeVisible()
    expect(
      Number.parseInt(
        await settings.evaluate((el) => el.style.getPropertyValue('--crt-delay')),
        10,
      ),
    ).toBeGreaterThan(0)
    await expect(picker).toHaveCount(0)
    await expect(settings).toHaveCSS('transform', WHOLE)
    // Only one shade is left once the picker has gone.
    await expect(page.locator('.backdrop')).toHaveCount(1)
  } finally {
    await close()
  }
})

/**
 * Watches the panes across a layout switch, from one frame to the next.
 *
 * The two halves last a few hundred milliseconds each, which is too short to
 * catch between separate Playwright calls - so the key is dispatched and the
 * panes sampled every frame inside the page, and what comes back is what was
 * ever seen.
 */
const watchSwitch = (page: Page, code: string) =>
  page.evaluate(
    async (key): Promise<{ off: boolean; on: boolean; delays: string[]; groupOff: boolean }> => {
      const seen = { off: false, on: false, delays: [] as string[], groupOff: false }
      const any = (selector: string): boolean => document.querySelector(selector) !== null
      const sample = (): void => {
        seen.off ||= any('[data-testid=pane].crt-off')
        // A tab group powers off as a whole, its header and strip with it.
        seen.groupOff ||= any('[data-testid=tabs-host].crt-off')
        const on = [...document.querySelectorAll<HTMLElement>('[data-testid=pane].crt-on')]
        seen.on ||= on.length > 0
        for (const pane of on) {
          const delay = pane.style.getPropertyValue('--crt-delay')
          if (delay !== '') seen.delays.push(delay)
        }
      }
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          key: '1',
          code: key,
          ctrlKey: true,
          shiftKey: true,
        }),
      )
      const start = performance.now()
      while (performance.now() - start < 2000) {
        sample()
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
      return seen
    },
    code,
  )

/** Saves the workspace under a name, from the layouts dialog. */
async function keepLayout(page: Page, name: string): Promise<void> {
  await page.keyboard.press('Control+Shift+KeyG')
  await page.getByTestId('layouts-name').fill(name)
  await page.getByTestId('layouts-save').click()
  await expect(page.getByTestId('layouts-item').filter({ hasText: name })).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('layouts-dialog')).toHaveCount(0)
}

test('a layout switch powers the old arrangement off and brings the new one on', async () => {
  const { page, close } = await launch(undefined, {
    layout: { version: 1, root: paneNode('term', 'terminal') },
    settings: { sound: { enabled: false }, layout: { confirmSwitch: false } },
  })
  try {
    await keepLayout(page, 'one')
    await keepLayout(page, 'two')
    // Something to come back to that is not what is on screen.
    await page.keyboard.press('Control+Shift+KeyA')
    await page.locator('[data-testid=pane-picker-item][data-widget=clock]').click()
    await expect(page.locator('[data-testid=pane]')).toHaveCount(2)

    const seen = await watchSwitch(page, 'Digit1')
    expect(seen.off, 'the arrangement being left powers off').toBe(true)
    expect(seen.on, 'the one arriving powers on').toBe(true)
    // One after another rather than all at once, as at boot.
    expect(seen.delays.length).toBeGreaterThan(0)
    await expect(page.locator('[data-testid=pane]')).toHaveCount(1)
  } finally {
    await close()
  }
})

test('a tab group powers off as one picture when the layout is switched', async () => {
  // Its header and tab strip are part of the picture: powering off only the tab
  // on top would leave the frame of an empty room lit.
  const group = {
    version: 1,
    root: {
      kind: 'tabs',
      id: 'g',
      activeIndex: 0,
      children: [paneNode('t1', 'terminal'), paneNode('t2', 'terminal')],
    },
  }
  const { page, close } = await launch(undefined, {
    layout: group,
    settings: { sound: { enabled: false }, layout: { confirmSwitch: false } },
  })
  try {
    await keepLayout(page, 'one')
    await keepLayout(page, 'two')
    await page.keyboard.press('Control+Shift+KeyA')
    await page.locator('[data-testid=pane-picker-item][data-widget=clock]').click()
    await expect(page.locator('[data-testid=pane]')).toHaveCount(3)

    const seen = await watchSwitch(page, 'Digit1')
    expect(seen.groupOff, 'the group powers off with its tabs').toBe(true)
    expect(seen.on).toBe(true)
    await expect(page.locator('[data-testid=pane]')).toHaveCount(2)
  } finally {
    await close()
  }
})

test('with motion reduced, a layout switch just happens', async () => {
  const { page, close } = await launch(undefined, {
    layout: { version: 1, root: paneNode('term', 'terminal') },
    settings: { sound: { enabled: false }, motion: 'reduced', layout: { confirmSwitch: false } },
  })
  try {
    await keepLayout(page, 'one')
    await keepLayout(page, 'two')
    await page.keyboard.press('Control+Shift+KeyA')
    await page.locator('[data-testid=pane-picker-item][data-widget=clock]').click()
    await expect(page.locator('[data-testid=pane]')).toHaveCount(2)

    const seen = await watchSwitch(page, 'Digit1')
    expect(seen.off, 'nothing powers off').toBe(false)
    expect(seen.on, 'nothing powers on').toBe(false)
    await expect(page.locator('[data-testid=pane]')).toHaveCount(1)
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

    // And so does a dialog.
    await page.keyboard.press('Control+Shift+KeyA')
    await expect(page.getByTestId('pane-picker')).toBeVisible()
    const after = await keysThen(page, [ESCAPE], '[data-testid=pane-picker]')
    expect(after.present).toBe(false)

    // A pane brought forward is simply there, at its full size, and simply back.
    await page.keyboard.press('Control+Shift+KeyZ')
    const forward = page.locator('[data-testid=pane].zoomed')
    await expect(forward).toHaveCount(1)
    await expect(forward).not.toHaveClass(/crt-zoom/)
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid=pane].zoomed')).toHaveCount(0)
    await expect(page.locator('.crt-zoom, .crt-zoom-out')).toHaveCount(0)
  } finally {
    await close()
  }
})

/** A plugin pane whose buttons are busy: one icon that turns, one that pulses. */
const BUSY_PLUGIN = `export default {
  apiVersion: 1, id: 'busy', title: 'busy',
  view(ctx) {
    ctx.render([{ t: 'buttons', items: [
      { action: 'refresh', text: 'refresh', icon: 'refresh', busy: true },
      { action: 'play', text: 'play', icon: 'play', busy: true },
    ] }])
  },
}`

/** The animation of each busy icon, with motion set in the app as `motion`. */
async function busyIcons(motion: 'system' | 'full' | 'reduced', osReduced: boolean) {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-e2e-'))
  mkdirSync(path.join(dir, 'plugins'))
  writeFileSync(path.join(dir, 'plugins', 'busy.js'), BUSY_PLUGIN)
  writeFileSync(
    path.join(dir, 'settings.json'),
    JSON.stringify({
      sound: { enabled: false },
      motion,
      plugins: { busy: { enabled: true, key: 'busy.js' } },
    }),
  )
  const { page, close } = await launch(dir, {
    layout: { version: 1, root: { kind: 'pane', id: 'p1', widget: 'plugin:busy' } },
  })
  try {
    await page.emulateMedia({ reducedMotion: osReduced ? 'reduce' : 'no-preference' })
    const icon = (name: string) =>
      page.locator(`[data-testid=plugin-button] svg[data-icon=${name}]`)
    await expect(icon('refresh')).toBeVisible()
    const animation = (name: string) =>
      icon(name).evaluate((el) => getComputedStyle(el).animationName)
    return { refresh: await animation('refresh'), play: await animation('play') }
  } finally {
    await close()
    removeDir(dir)
  }
}

test('a busy button icon follows the motion setting: it turns, or pulses with motion reduced', async () => {
  // As the OS says, unless the setting says otherwise.
  const system = await busyIcons('system', false)
  expect(system.refresh).toMatch(/turn/)
  expect(system.play).toMatch(/pulse/)
  expect((await busyIcons('system', true)).refresh).toMatch(/pulse/)

  // The in-app setting wins either way.
  const reduced = await busyIcons('reduced', false)
  expect(reduced.refresh).toMatch(/pulse/)
  expect(reduced.play).toMatch(/pulse/)
  expect((await busyIcons('full', true)).refresh).toMatch(/turn/)
})

/**
 * A toast is raised from a running timer, which is the shortest way to one that
 * does not involve waiting for a deadline or a release.
 */
const shortTimer = {
  version: 1,
  root: { kind: 'pane', id: 't', widget: 'timer', state: { mode: 'timer', durationMs: 1000 } },
}

test('a toast powers on like the rest of the HUD, and just appears with motion reduced', async () => {
  for (const motion of ['full', 'reduced'] as const) {
    const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-motion-'))
    writeFileSync(
      path.join(dir, 'settings.json'),
      JSON.stringify({ sound: { enabled: false }, motion }),
    )
    const { page, close } = await launch(dir, { layout: shortTimer })
    try {
      await page.getByTestId('timer-start').click()
      const toast = page.getByTestId('toast')
      await expect(toast).toHaveCount(1, { timeout: 15_000 })
      const style = await toast.evaluate((el) => {
        const s = getComputedStyle(el)
        return { name: s.animationName, duration: s.animationDuration }
      })
      if (motion === 'reduced') {
        // Not a shortened power-on: no animation at all, and the card is simply there.
        expect(style.name).toBe('none')
      } else {
        expect(style.name).toMatch(/crt-power-on/)
        expect(style.duration).toBe('0.32s')
      }
    } finally {
      await close()
      removeDir(dir)
    }
  }
})
