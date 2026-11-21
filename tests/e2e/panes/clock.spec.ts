import { expect, type Locator } from '@playwright/test'
import { single } from '../support/layouts.js'
import { test } from '../support/shared.js'
import { openSettings } from '../support/workspace.js'

/**
 * The CLOCK pane's faces: chosen in the settings dialog, drawn by every clock pane at once, and
 * each one fitting the default layout's low strip - the pane is about 340 by 32-48 there, and a
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
    await expect(dialog.getByTestId('settings-clock-summary')).toContainText('analogue dial')
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

test('every face fits the default layout’s clock strip, and the pane brought forward', async ({
  shared,
}) => {
  const { page, close } = await shared()
  let alarm: string | null = null
  try {
    // A long name for AHEAD's list, ten minutes from now.
    const soon = new Date(Date.now() + 10 * 60_000)
    alarm = await page.evaluate(
      async ([hour, minute]) =>
        (
          await window.elecdex.alarms.add({
            label: 'A rather long alarm name that would wrap past the edge of a pane',
            hour,
            minute,
            days: [],
          })
        )?.id ?? null,
      [soon.getHours(), soon.getMinutes()] as const,
    )
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
      }
    }
    await page.keyboard.press('Escape')
  } finally {
    await page.evaluate(async (id) => {
      if (id !== null) await window.elecdex.alarms.remove(id)
      await window.elecdex.settings.patch({ clock: { face: 'longitude' } })
    }, alarm)
    await close()
  }
})
