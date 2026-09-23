import { expect, type Locator, type Page, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * A pane's header and its corner buttons (layout/PaneCorner.svelte), which appear
 * over the header's right end on hover. Reported: a tab group's folder or page
 * title, and a module's readout, went under ⤢ and ×. A shell's or a group's
 * header now centres what it shows, and every header keeps the buttons' room.
 */

const box = async (locator: Locator) => {
  const found = await locator.boundingBox()
  if (found === null) throw new Error('not on screen')
  return found
}

/** The text ends before the first of the corner's buttons begins. */
async function clearOfCorner(text: Locator, corner: Locator): Promise<void> {
  const [t, c] = [await box(text), await box(corner)]
  expect(t.x + t.width).toBeLessThanOrEqual(c.x)
}

async function hover(page: Page, pane: Locator): Promise<void> {
  const b = await box(pane)
  await page.mouse.move(b.x + 40, b.y + b.height / 2)
}

test('a tab group centres its folder, clear of the corner buttons', async () => {
  const { page, close } = await launch()
  try {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const group = page.getByTestId('tabs-host').first()
    const subtitle = group.getByTestId('group-subtitle')
    await expect(subtitle).not.toHaveText(/^(…)?$/, { timeout: 30_000 })
    await hover(page, group)
    const zoom = group.getByTestId('group-zoom')
    await expect(zoom).toHaveCSS('opacity', '1')
    await clearOfCorner(subtitle, zoom)
    const [s, h] = [await box(subtitle), await box(group.getByTestId('group-head'))]
    expect(Math.abs(s.x + s.width / 2 - (h.x + h.width / 2))).toBeLessThan(4)
  } finally {
    await close()
  }
})

test('a shell in a narrow column cuts its folder before the corner, and a module its readout', async () => {
  const narrow = {
    version: 1,
    root: {
      kind: 'split',
      id: 's',
      direction: 'row',
      sizes: [0.86, 0.14],
      children: [
        { kind: 'pane', id: 'm', widget: 'markets' },
        { kind: 'pane', id: 't', widget: 'terminal' },
      ],
    },
  }
  const { page, close } = await launch(undefined, { layout: narrow })
  try {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const shell = page.locator('[data-testid=pane][data-widget=terminal]')
    const folder = shell.getByTestId('pane-subtitle')
    await expect(folder).not.toHaveText(/^(…)?$/, { timeout: 30_000 })
    await hover(page, shell)
    await expect(shell.getByTestId('pane-zoom')).toHaveCSS('opacity', '1')
    // The span that holds it, cut with an ellipsis, not the text it would need.
    await clearOfCorner(shell.locator('.pane-head-sub'), shell.getByTestId('pane-zoom'))

    const markets = page.locator('[data-testid=pane][data-widget=markets]')
    await hover(page, markets)
    const corner = markets.getByTestId('pane-zoom')
    await expect(corner).toHaveCSS('opacity', '1')
    await clearOfCorner(markets.locator('.module-title .sub'), corner)
  } finally {
    await close()
  }
})
