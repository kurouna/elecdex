import { expect } from '@playwright/test'
import { test } from '../support/shared.js'
import { atDesignSize } from '../support/workspace.js'
import { beside, launch, single, waitForSaved } from '../support.js'

/**
 * The calendar: its months, its language and its holidays.
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

test('a calendar with room for them shows the months either side', async ({ shared }) => {
  // A pane the size of the window: the month on screen keeps the middle, with
  // the month before and the month after beside it, and only the middle one
  // carries today. The pane in the default layout has room for one.
  const { page, close } = await shared({ layout: layout('calendar') })
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

// Business's face is wider than the others': the weekdays' names took more than their columns.
for (const theme of ['tron', 'business-light']) {
  test(`three months in a pane only just wide enough each keep to their own third in ${theme}`, async () => {
    // Found in the desk preset's full-screen shot: the dates were sized by the whole pane's width,
    // three times too large for a month's third of it, and the three grids ran into each other;
    // the weekdays' names over them did too.
    // At the design size, whatever the screen: a third of 1920 is about 640, just over the
    // three months' 620 (lib/calendar.ts).
    const { app, page, close } = await launch(undefined, {
      layout: beside('calendar', { id: 'w', other: 'terminal', sizes: [0.34, 0.66] }),
      settings: { theme },
    })
    try {
      await atDesignSize(app, page)
      await expect(page.getByTestId('calendar-grid')).toHaveCount(3)
      const spans = await page.getByTestId('calendar-grid').evaluateAll((grids) =>
        grids.map((grid) => {
          // The dates and the weekdays over them, each by the text it shows.
          const days = [...grid.querySelectorAll('[data-testid=calendar-day], [role=columnheader]')]
            .filter((d) => (d as HTMLElement).offsetParent !== null)
            .map((d) => {
              const range = document.createRange()
              range.selectNodeContents(d)
              return range.getBoundingClientRect()
            })
            .filter((r) => r.width > 0)
          return {
            left: Math.min(...days.map((r) => r.left)),
            right: Math.max(...days.map((r) => r.right)),
          }
        }),
      )
      for (const [i, span] of spans.slice(1).entries()) {
        expect(spans[i]?.right ?? 0, JSON.stringify(spans)).toBeLessThanOrEqual(span.left)
      }
      // And the last stays inside the pane.
      const pane = await page.getByTestId('calendar').boundingBox()
      expect(spans.at(-1)?.right ?? 0).toBeLessThanOrEqual((pane?.x ?? 0) + (pane?.width ?? 0))
    } finally {
      await close()
    }
  })
}

test('a calendar with room for one month shows one', async ({ shared }) => {
  const { page, close } = await shared({
    layout: beside('calendar', { id: 'c', other: 'terminal', sizes: [0.22, 0.78] }),
  })
  try {
    await expect(page.getByTestId('calendar-grid')).toHaveCount(1)
    await expect(page.getByTestId('calendar-day')).toHaveCount(42)
  } finally {
    await close()
  }
})

test('the calendar is in English, and holidays are ticked per country in its settings', async () => {
  // Japanese app language: the calendar's text stays English regardless.
  let launched = await launch(undefined, { layout: layout('calendar'), args: ['--lang=ja'] })
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

    await paneStateSaved(launched.userData, { holidays: ['jp'] })
    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('calendar')).toHaveAttribute('data-holidays', 'jp')
    await launched.page.getByTestId('calendar-settings-toggle').click()
    await expect(launched.page.getByTestId('calendar-holidays-jp')).toBeChecked()
  } finally {
    await launched.close()
  }
})
