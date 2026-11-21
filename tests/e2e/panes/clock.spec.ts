import { expect } from '@playwright/test'
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
    await expect(clock).toHaveAttribute('data-face', 'week')
    const dialog = await openSettings(page, 'general')
    const select = dialog.getByTestId('settings-clock-face')
    await expect(select.locator('option')).toHaveText([
      'week',
      'ahead',
      'tape',
      'longitude',
      'digital',
      'segment',
      'vector',
      'dial',
      'karman (uses more CPU)',
    ])
    await select.selectOption('dial')
    await expect(clock).toHaveAttribute('data-face', 'dial')
    await expect(page.getByTestId('clock-dial')).toBeVisible()
    await select.selectOption('week')
    await expect(clock).toHaveAttribute('data-face', 'week')
    await page.keyboard.press('Escape')
  } finally {
    await close()
  }
})

test('every face fits the default layout’s clock strip and draws something in it', async ({
  shared,
}) => {
  const { page, close } = await shared()
  try {
    const clock = page.getByTestId('clock').first()
    await expect(clock).toBeVisible()
    for (const face of FACES) {
      await page.evaluate((f) => window.elecdex.settings.patch({ clock: { face: f } }), face)
      await expect(clock).toHaveAttribute('data-face', face)
      // Nothing of the face reaches past the pane's edges, and it is not blank.
      await expect
        .poll(() =>
          clock.evaluate((el, face) => {
            const box = el.getBoundingClientRect()
            const parts = [...el.querySelectorAll('*')].map((e) =>
              Object.assign(e.getBoundingClientRect().toJSON(), {
                tag: `${e.tagName}.${e.getAttribute('class') ?? ''}`,
              }),
            )
            const drawn = parts.filter((r) => r.width > 0 && r.height > 0)
            // SVG text is measured by its font's line box, taller than its figures: it is held to
            // the pane's sides only. Everything else is held to all four edges.
            const out = drawn.filter(
              (r) =>
                r.left < box.left - 1 ||
                r.right > box.right + 1 ||
                (!r.tag.startsWith('text') && (r.top < box.top - 1 || r.bottom > box.bottom + 1)),
            )
            return {
              drawn: drawn.length > 0,
              out: out.map(
                (r) =>
                  `${face} ${r.tag} ${Math.round(r.left - box.left)},${Math.round(r.top - box.top)} ${Math.round(r.width)}x${Math.round(r.height)} in ${Math.round(box.width)}x${Math.round(box.height)}`,
              ),
            }
          }, face),
        )
        .toEqual({ drawn: true, out: [] })
    }
  } finally {
    await page.evaluate(() => window.elecdex.settings.patch({ clock: { face: 'week' } }))
    await close()
  }
})
