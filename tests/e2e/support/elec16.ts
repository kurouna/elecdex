import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { type Launched, launch } from './launch.js'
import { atDesignSize } from './workspace.js'

/**
 * The ELEC-16 pane's machine, driven as a person drives it (docs/elec16.md, section 15 for the
 * traps): its LCD read back, booted, a line typed no faster than the machine takes it, the
 * monitor reached, a panel tab.
 */

/** The ELEC-16 pane (id e16) beside a clock, the pane given four fifths of the row. */
export const ELEC16_BESIDE_CLOCK = {
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [20, 80],
    children: [
      { kind: 'pane', id: 'clock', widget: 'clock' },
      { kind: 'pane', id: 'e16', widget: 'elec16' },
    ],
  },
}

/**
 * At the 1920x1080 design size (support.ts): beside the clock the pane keeps its panel open
 * only with room for it beside the screen (`panelShown`), which a CI runner's screen does not
 * give - 1024 wide, the pane was 806 pixels, short of the 812 the panel needs, and every test
 * waiting on a panel tab timed out there.
 */
export async function atSize(launched: Launched): Promise<Launched> {
  await atDesignSize(launched.app, launched.page)
  return launched
}

/** Launched on a fresh profile with the pane beside the clock, at the design size. */
export const launchElec16Beside = async (): Promise<Launched> =>
  atSize(await launch(undefined, { layout: ELEC16_BESIDE_CLOCK }))

/** The LCD's text, read back through the font (the screen reader's copy), row by row. */
export const lcdLines = async (page: Page): Promise<string[]> =>
  ((await page.getByTestId('elec16-text').textContent()) ?? '').split('\n').map((l) => l.trimEnd())

/** PLAY-320's screen text, each row trimmed (it centres its words). */
export const playLines = async (page: Page): Promise<string[]> =>
  (await lcdLines(page)).map((l) => l.trim())

/** Switched on: BASIC's banner, asleep at its prompt. */
export async function booted(page: Page): Promise<void> {
  await expect.poll(() => lcdLines(page), { timeout: 15_000 }).toContain('ELEC-16 BASIC 1.0')
  await expect(page.getByTestId('elec16')).toHaveAttribute('data-asleep', 'true')
}

/** Text as compared with the LCD's: upper case (CAPS), without spaces or line breaks. */
export const squeezed = (text: string): string => text.toUpperCase().replace(/\s+/g, '')

/** At most this many keys typed before the machine must show it took them (its FIFO holds 16). */
export const TYPE_AHEAD = 8

/**
 * Types a line into the focused pane a key at a time, a few keys ahead of the machine at most:
 * each run of keys is echoed on the LCD before the next is typed. The machine's key FIFO
 * holds 16 and drops the rest, as the hardware's does; a slow runner's machine (a card write
 * waiting on main, a late frame) once fell 16 keys behind a line typed at 15 ms a key, and the
 * keys after them were lost (macOS CI: "PRINT" read as "PRI"). With `focus`, the page's one
 * ELEC-16 pane is focused first.
 */
export async function typeLine(
  page: Page,
  line: string,
  options: { focus?: boolean } = {},
): Promise<void> {
  if (options.focus) await page.getByTestId('elec16').focus()
  for (let at = 0; at < line.length; at += TYPE_AHEAD) {
    const run = line.slice(at, at + TYPE_AHEAD)
    await page.keyboard.type(run, { delay: 15 })
    const typed = squeezed(line.slice(0, at + run.length))
    // The focused pane's screen read whole, without spaces: a long line wraps onto the next row,
    // and a row's trailing space is trimmed when it is read.
    await expect
      .poll(async () =>
        squeezed(
          (await page
            .locator('[data-testid=pane]:has(:focus)')
            .getByTestId('elec16-text')
            .textContent()) ?? '',
        ).includes(typed),
      )
      .toBe(true)
  }
  await page.keyboard.press('Enter')
}

/** From BASIC's prompt to the monitor's (MON), on a cleared screen (CLS is Home). */
export async function toMonitor(page: Page): Promise<void> {
  await page.getByTestId('elec16').focus()
  await typeLine(page, 'mon')
  await expect.poll(() => lcdLines(page)).toContain('ELEC-16 MONITOR 0.1')
  await page.keyboard.press('Home')
  await expect.poll(async () => (await lcdLines(page))[0]).toBe('*')
}

/** The panel's tab `name` (tune, files, mem, core, code, games, link, ...). */
export const elec16Tab = (page: Page, name: string): Locator =>
  page.getByTestId('elec16-tab').and(page.locator(`[data-tab=${name}]`))
