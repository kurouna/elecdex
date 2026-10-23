import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { ElectronApplication, Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { savedLayout } from './launch.js'

/**
 * Waits until no layout is being carried away or brought up.
 *
 * Applying a saved layout - and resetting, which is the same thing - powers the
 * screen off and the next arrangement on, and through all of it the panes are
 * drawn scaled and clipped. Anything that measures a pane or presses on one has
 * to wait for that to end, or it will press where the pane is going to be
 * rather than where it is.
 */
export async function settleLayout(page: Page): Promise<void> {
  await expect(page.getByTestId('workspace')).toHaveAttribute('data-switching', 'false')
}

/**
 * Brings up the status bar, which stays hidden until the pointer reaches the
 * bottom edge of the window.
 */
export async function showStatusBar(page: Page): Promise<void> {
  const size = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }))
  await page.mouse.move(size.w / 2, size.h - 2)
  await expect(page.getByTestId('status-bar')).toHaveAttribute('data-shown', 'true')
}

/**
 * Waits until no pane is flying to or from the front of the workspace: until it
 * has landed, a pane brought forward is drawn transformed, so anything measured
 * from it is where it is passing, not where it will be.
 */
export async function zoomSettled(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .getAnimations()
          .some(
            (a) => (a as CSSAnimation).animationName === 'crt-zoom' && a.playState === 'running',
          ),
      ),
    )
    .toBe(false)
}

/**
 * Waits until a dialog or popup has powered on (`crt-on`). Until then it is
 * drawn scaled from a line, overshooting on the way, so a button in it moves
 * between a press and its release, and the click is lost: on the macOS runner
 * one pressed about 200 ms into a popup's power-on never chose what it was on.
 */
export async function poweredOn(target: Locator): Promise<void> {
  await expect
    .poll(() =>
      target.evaluate((el) =>
        el
          .getAnimations()
          .some(
            (a) =>
              (a as CSSAnimation).animationName === 'crt-power-on' && a.playState === 'running',
          ),
      ),
    )
    .toBe(false)
}

/**
 * Gives the page the 1920x1080 the default layout is designed for.
 *
 * A screen that cannot give the window that many pixels - a headless runner's is
 * often far smaller - gets them as CSS pixels instead, by zooming out: the same
 * layout in the same units. A pane measured in a window narrower than that is
 * not the pane anyone designed, and what does not fit in it there says nothing
 * about the widget.
 *
 * The zoom is worked out again until the page has the size, not once: a window
 * asked to be larger than its screen says it is for a moment, and is cut down to the
 * screen after. Read once, straight after the asking, the macOS runner's window
 * was 1920 wide and 1080 tall - so no zoom - and then 677 tall.
 */
export async function atDesignSize(app: ElectronApplication, page: Page): Promise<void> {
  const asked = await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0]
    win?.setContentSize(1920, 1080)
    return win !== undefined
  })
  expect(asked, 'no window to size').toBe(true)
  await expect
    .poll(async () => {
      await app.evaluate(({ BrowserWindow }) => {
        const win = BrowserWindow.getAllWindows()[0]
        if (!win) return
        const [width = 0, height = 0] = win.getContentSize()
        const zoom = Math.min(1, width / 1920, height / 1080)
        if (zoom > 0 && Math.abs(win.webContents.getZoomFactor() - zoom) > 0.001) {
          win.webContents.setZoomFactor(zoom)
        }
      })
      return page.evaluate(() => Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    })
    .toBeGreaterThanOrEqual(0.99)
}

/** What a click leaves on screen a frame later: whether each selector finds something, and whether it is leaving. */
export interface AfterClick {
  [selector: string]: { present: boolean; leaving: boolean; beamRunning: boolean }
}

/**
 * Clicks `button` and, a frame later, describes `selectors`: a notice or a
 * dialog powers off for 300 ms, too short to catch reliably between separate
 * Playwright calls. Leaving means Svelte has made it inert for its close; the
 * beam is its closing glow (crt.css), playing now.
 */
export function clickThen(page: Page, button: string, selectors: string[]): Promise<AfterClick> {
  return page.evaluate(
    async ({ button, selectors }) => {
      document.querySelector<HTMLElement>(button)?.click()
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const result: AfterClick = {}
      for (const selector of selectors) {
        const el = document.querySelector<HTMLElement>(selector)
        const beamRunning = document.getAnimations().some((a) => {
          const effect = a.effect as KeyframeEffect | null
          return (
            el !== null &&
            effect?.target === el &&
            effect.pseudoElement === '::after' &&
            (a as CSSAnimation).animationName === 'crt-beam-off' &&
            a.playState === 'running'
          )
        })
        result[selector] = { present: el !== null, leaving: el?.inert ?? false, beamRunning }
      }
      return result
    },
    { button, selectors },
  )
}

/** The state of a notice or dialog that is powering off. */
export const LEAVING = { present: true, leaving: true, beamRunning: true }

/** The state of one that is showing. */
export const SHOWING = { present: true, leaving: false, beamRunning: false }

/** Where the selected row of a keyboard-driven list sits. */
export interface SelectedRow {
  /** The row's place among the rows of the list, counting from zero. */
  index: number
  /** Whether the list has more rows than fit: a test about scrolling needs one that does. */
  scrollable: boolean
  /** Whether the row is inside the part of the list that is on screen. */
  inView: boolean
}

/**
 * Reads the selection of a listbox driven from the keyboard (the add-pane
 * picker, the weather place picker). Playwright's own visibility ignores the
 * scroller's clipping, so the rectangles are compared here.
 */
export function selectedRow(page: Page, listbox: string): Promise<SelectedRow | null> {
  return page.evaluate((selector) => {
    const list = document.querySelector(selector)
    if (list === null) return null
    const rows = [...list.querySelectorAll('[role=option]')]
    const row = rows.find((r) => r.getAttribute('aria-selected') === 'true')
    if (row === undefined) return null
    const box = list.getBoundingClientRect()
    const seat = row.getBoundingClientRect()
    return {
      index: rows.indexOf(row),
      scrollable: list.scrollHeight > list.clientHeight + 1,
      // A row sitting exactly on the edge counts as shown, hence the pixel of slack.
      inView: seat.top >= box.top - 1 && seat.bottom <= box.bottom + 1,
    }
  }, listbox)
}

/** Keeps the layout on screen as a saved layout named `name`, through the layouts dialog. */
export async function keepLayout(page: Page, name: string): Promise<void> {
  await page.keyboard.press('Control+Shift+KeyG')
  await page.getByTestId('layouts-name').fill(name)
  await page.getByTestId('layouts-save').click()
  await expect(page.getByTestId('layouts-item').filter({ hasText: name })).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('layouts-dialog')).toHaveCount(0)
}

/** A pane of `widget` that is on screen (a tab behind another is mounted but hidden). */
export const paneOf = (page: Page, widget: string): Locator =>
  page.locator(`[data-testid=pane][data-widget="${widget}"]:not(.hidden)`)

/** The pane with layout id `id`. */
export const paneById = (page: Page, id: string): Locator =>
  page.locator(`[data-testid=pane][data-pane-id="${id}"]`)

/**
 * Closes a pane from its own corner button and waits until it has gone. The corner shows on
 * hover; the press is held a moment, as for anything drawn over other elements.
 */
export async function closePane(pane: Locator): Promise<void> {
  await pane.hover()
  await pane.getByTestId('pane-close').click({ delay: 20 })
  await expect(pane).toHaveCount(0)
}

/** Reloads the page and waits for the workspace to be drawn again. */
export async function reloadWorkspace(page: Page): Promise<void> {
  await page.reload()
  await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
}

/** Opens the settings dialog, at `section` when given (`data-section` of its tab). */
export async function openSettings(page: Page, section?: string): Promise<Locator> {
  await page.keyboard.press('Control+Shift+Period')
  const dialog = page.getByTestId('settings-dialog')
  await expect(dialog).toBeVisible()
  if (section !== undefined) {
    await page.locator(`[data-testid=settings-section][data-section="${section}"]`).click()
  }
  return dialog
}

/**
 * Waits until main has written a layout.json that `predicate` accepts, and answers its text:
 * the save is debounced, so a test about what is kept waits for the file, never a fixed time.
 * The text is as main writes it (indented JSON); parse it rather than match spacing.
 */
export async function waitForSaved(
  userData: string,
  predicate: (text: string) => boolean,
  timeout = 15_000,
): Promise<string> {
  let last = ''
  await expect
    .poll(
      () => {
        last = savedLayout(userData) ?? ''
        return last !== '' && predicate(last)
      },
      { timeout, intervals: [200] },
    )
    .toBe(true)
  return last
}

/** settings.json as main last wrote it, parsed, or null before its first write. */
export function savedSettings(userData: string): Record<string, unknown> | null {
  const file = path.join(userData, 'settings.json')
  return existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>)
    : null
}
