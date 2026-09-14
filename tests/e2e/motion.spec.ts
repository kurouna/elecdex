import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * Entrance effects: the calendar's wave, a new pane's power-on, and both staying
 * still with motion reduced. The effects are CSS animations of elements created
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

test('with motion reduced, nothing moves: the wave ends before it begins and a new pane just appears', async () => {
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
  } finally {
    await close()
  }
})
