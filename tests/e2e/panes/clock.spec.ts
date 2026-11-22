import { expect, type Locator, type Page } from '@playwright/test'
import { single } from '../support/layouts.js'
import { test } from '../support/shared.js'
import { openSettings } from '../support/workspace.js'

/**
 * The CLOCK pane's faces: chosen in the settings dialog, drawn by every clock pane at once, and
 * each one fitting the default layout's low strip - the pane is about 340 by 70-90 there, and a
 * face that spills out of it or leaves it blank is the first thing anyone would see.
 */

const FACES = [
  'week',
  'ahead',
  'tape',
  'longitude',
  'digital',
  'segment',
  'vector',
  'dial',
  'karman',
]

test('the faces are listed in settings, the heavy one says so, and choosing one redraws the clock', async ({
  shared,
}) => {
  const { page, close } = await shared({ layout: single('clock') })
  try {
    const clock = page.getByTestId('clock')
    await expect(clock).toHaveAttribute('data-face', 'longitude')
    const dialog = await openSettings(page, 'general')
    const select = dialog.getByTestId('settings-clock-face')
    await expect(select.locator('option')).toHaveText([
      'longitude',
      'week',
      'ahead',
      'tape',
      'digital',
      'segment',
      'vector',
      'dial',
      'karman (uses more CPU)',
    ])
    await expect(dialog.getByTestId('settings-clock-summary')).toContainText('time zones')
    await select.selectOption('dial')
    await expect(clock).toHaveAttribute('data-face', 'dial')
    // What the chosen face shows, under the list: the dialog covers the clock itself.
    await expect(dialog.getByTestId('settings-clock-summary')).toContainText('analog dial')
    await expect(page.getByTestId('clock-dial')).toBeVisible()
    await select.selectOption('longitude')
    await expect(clock).toHaveAttribute('data-face', 'longitude')
    await page.keyboard.press('Escape')
  } finally {
    await close()
  }
})

/** What of a face reaches past `edge` px inside the clock's box: none, for a face that fits. */
async function spills(clock: Locator, face: string): Promise<{ drawn: boolean; out: string[] }> {
  return clock.evaluate((el, face) => {
    const box = el.getBoundingClientRect()
    const parts = [...el.querySelectorAll('*')].map((e) =>
      Object.assign(e.getBoundingClientRect().toJSON(), {
        tag: `${e.tagName}.${e.getAttribute('class') ?? ''}`,
        band: e.matches('.strip > svg'),
      }),
    )
    const drawn = parts.filter((r) => r.width > 0 && r.height > 0)
    // A band face's band keeps clear of the strip's padding (12 px each side): it once ran into
    // the right-hand padding, inside the box, where only this stricter edge sees it.
    const out = drawn.filter((r) => {
      const inset = r.band ? 11 : -1
      return (
        r.left < box.left + inset ||
        r.right > box.right - inset ||
        // SVG text is measured by its font's line box, taller than its figures: held to the
        // pane's sides only. Everything else is held to all four edges.
        (!r.tag.startsWith('text') && (r.top < box.top - 1 || r.bottom > box.bottom + 1))
      )
    })
    return {
      drawn: drawn.length > 0,
      out: out.map(
        (r) =>
          `${face} ${r.tag} ${Math.round(r.left - box.left)},${Math.round(r.top - box.top)} ${Math.round(r.width)}x${Math.round(r.height)} in ${Math.round(box.width)}x${Math.round(box.height)}`,
      ),
    }
  }, face)
}

/** What one face must show beyond fitting: AHEAD's label in its band, TAPE's past shaded. */
async function facesOwnChecks(page: Page, face: string, forward: boolean): Promise<void> {
  if (face === 'ahead') {
    // The nearest's name inside its band, cut short where it must be.
    await expect
      .poll(() =>
        page.getByTestId('clock-ahead-next').evaluate((el) => {
          const band = el.closest('svg')?.getBoundingClientRect()
          const r = el.getBoundingClientRect()
          return band !== undefined && r.left >= band.left - 1 && r.right <= band.right + 1
        }),
      )
      .toBe(true)
  }
  if (face === 'tape' && forward) {
    // The hours gone are dimmed: the past's shade is not transparent.
    const fill = await page
      .getByTestId('clock-tape-past')
      .evaluate((el) => getComputedStyle(el).fill)
    expect(fill).not.toMatch(/\/ 0\)$|rgba\(0, 0, 0, 0\)|transparent/)
  }
}

test('every face fits the default layout’s clock strip, and the pane brought forward', async ({
  shared,
}) => {
  const { page, close } = await shared()
  const alarms: string[] = []
  try {
    // Long names for AHEAD's label and list: one in English ten minutes from now, one in
    // Japanese three hours from now - a label too long for either side of its marker once ran
    // off the band's left (review 2026-11-22).
    for (const [label, ahead] of [
      ['A rather long alarm name that would wrap past the edge of a pane', 10],
      ['朝会の準備をする定例ミーティングの資料', 180],
    ] as const) {
      const at = new Date(Date.now() + ahead * 60_000)
      const id = await page.evaluate(
        async ([name, hour, minute]) =>
          (await window.elecdex.alarms.add({ label: name, hour, minute, days: [] }))?.id ?? null,
        [label, at.getHours(), at.getMinutes()] as const,
      )
      if (id !== null) alarms.push(id)
    }
    const clock = page.getByTestId('clock').first()
    await expect(clock).toBeVisible()
    for (const forward of [false, true]) {
      if (forward) {
        await clock.click()
        await page.keyboard.press('Control+Shift+Z')
        await expect.poll(async () => (await clock.boundingBox())?.height ?? 0).toBeGreaterThan(300)
      }
      for (const face of FACES) {
        await page.evaluate((f) => window.elecdex.settings.patch({ clock: { face: f } }), face)
        await expect(clock).toHaveAttribute('data-face', face)
        await expect.poll(() => spills(clock, face)).toEqual({ drawn: true, out: [] })
        await facesOwnChecks(page, face, forward)
      }
    }
    await page.keyboard.press('Escape')
  } finally {
    await page.evaluate(async (ids) => {
      for (const id of ids) await window.elecdex.alarms.remove(id)
      await window.elecdex.settings.patch({ clock: { face: 'longitude' } })
    }, alarms)
    await close()
  }
})
