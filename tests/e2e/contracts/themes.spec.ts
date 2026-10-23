import { expect, test } from '@playwright/test'
import { BUILTIN_THEMES, themeVariables } from '../../../src/shared/theme.js'
import { launch, quietFor, showStatusBar } from '../support.js'

/**
 * The themes contract (docs/e2e-design.md, section 3.2): every built-in theme, switched to in
 * one running app, restyles the workspace without a fault - no pane faults, no page error, every
 * pane still drawn - marks a light theme `data-mode="light"` on the root, and sets every one of
 * its variables there (`themeVariables`, so nothing of the theme before lingers). A handful of
 * panes stands for the rest: a shell, the canvas charts, the globe's WebGL, text panes.
 * What a theme looks like is appearance.spec's and the component tests'.
 */

const WIDGETS = ['terminal', 'cpu', 'globe', 'clock', 'calendar', 'notes']

const LAYOUT = {
  version: 1,
  root: {
    kind: 'split',
    id: 'rows',
    direction: 'column',
    sizes: [50, 50],
    children: [0, 1].map((row) => ({
      kind: 'split',
      id: `row${row}`,
      direction: 'row',
      sizes: [34, 33, 33],
      children: WIDGETS.slice(row * 3, row * 3 + 3).map((widget) => ({
        kind: 'pane',
        id: widget,
        widget,
      })),
    })),
  },
}

/** Fonts are lists the browser may re-serialise; everything else is read back as set. */
const FONT = /^--font-/

test('every built-in theme restyles the workspace without a fault, and sets every variable', async () => {
  test.setTimeout(180_000)
  const { page, close } = await launch(undefined, { layout: LAYOUT })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await expect(page.getByTestId('pane')).toHaveCount(WIDGETS.length)

    // The status bar offers every one of them.
    await showStatusBar(page)
    const offered = await page
      .getByTestId('theme-select')
      .locator('option')
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value))
    expect(BUILTIN_THEMES.map((t) => t.id).filter((id) => !offered.includes(id))).toEqual([])

    const failed: Record<string, string> = {}
    for (const theme of BUILTIN_THEMES) {
      try {
        await page.evaluate((id) => window.elecdex.settings.patch({ theme: id }), theme.id)
        const root = page.locator('html')
        await expect(root).toHaveAttribute('data-theme', theme.id)
        await expect(root).toHaveAttribute('data-mode', theme.mode ?? 'dark')

        const expected = themeVariables(theme)
        const found = await page.evaluate((names) => {
          const style = document.documentElement.style
          const computed = getComputedStyle(document.documentElement)
          return Object.fromEntries(
            names.map((name) => [
              name,
              { set: style.getPropertyValue(name).trim(), used: computed.getPropertyValue(name) },
            ]),
          )
        }, Object.keys(expected))
        const wrong = Object.entries(expected).filter(([name, value]) => {
          const read = found[name]
          if (read === undefined || read.set === '' || read.used.trim() === '') return true
          return !FONT.test(name) && read.set !== value
        })
        expect(wrong.map(([name]) => name)).toEqual([])

        // Every pane drawn in it, none faulted; and nothing goes wrong as the canvases and
        // the globe re-read their colours over the next frames.
        await expect(page.getByTestId('pane-fault')).toHaveCount(0)
        const drawn = await page
          .getByTestId('pane')
          .evaluateAll((panes) => panes.map((p) => p.querySelectorAll('*').length > 3))
        expect(drawn).toEqual(WIDGETS.map(() => true))
        await quietFor(600, async () => errors.length, 'the page errors')
        await expect(page.getByTestId('pane-fault')).toHaveCount(0)
      } catch (error) {
        failed[theme.id] = String((error as Error).message).split('\n')[0] ?? ''
      }
    }
    expect(failed).toEqual({})
    expect(errors).toEqual([])
  } finally {
    await close()
  }
})
