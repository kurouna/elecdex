import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { type ElectronApplication, expect, type Page } from '@playwright/test'
import { single } from './layouts.js'
import { pickerAnswers } from './os.js'

/**
 * LOG WATCH in the running app: logs the test writes in a temp folder, the file chosen through
 * main's picker (replaced in main), and the pane's rows (docs/logwatch.md).
 */

/** Now, as a log writes it: the five minutes' figures count by the log's own time. */
export function stamp(): string {
  const t = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`
}

/** Lines `from` to `to`, stamped now: `<now> INFO <word> <n>`. */
export const lines = (from: number, to: number, word = 'line'): string =>
  Array.from({ length: to - from + 1 }, (_, i) => `${stamp()} INFO ${word} ${from + i}\n`).join('')

/** Lines `from` to `to` at one fixed time, alike but for their number: they fold into one row. */
export const requestLines = (from: number, to: number): string =>
  Array.from(
    { length: to - from + 1 },
    (_, i) => `2026-10-12 12:00:00 INFO request ${from + i} done\n`,
  ).join('')

/** A new temp folder, and the path of `app.log` in it (not yet written). */
export function logFolder(prefix = 'elecdex-logwatch-'): { dir: string; file: string } {
  const dir = mkdtempSync(path.join(tmpdir(), prefix))
  return { dir, file: path.join(dir, 'app.log') }
}

/** One LOG WATCH pane, id `l`, filling the window. */
export const singleLog = (state?: Record<string, unknown>) =>
  single('logwatch', state === undefined ? { id: 'l' } : { id: 'l', state })

/** The pane's rows. */
export const rows = (page: Page) => page.getByTestId('logwatch-row')

/** The pane's lamp: LIVE, WAITING FOR FILE, PAUSED. */
export const lamp = (page: Page) => page.getByTestId('logwatch-lamp')

/**
 * Chooses `file` through main's picker - by its name's pattern, the newest like it, when
 * `newest` - and waits until the pane follows it.
 */
export async function choose(
  page: Page,
  app: ElectronApplication,
  file: string,
  newest = false,
): Promise<void> {
  await pickerAnswers(app, file)
  await page.getByTestId(newest ? 'logwatch-select-newest' : 'logwatch-select').click()
  await expect(lamp(page)).toContainText('LIVE', { timeout: 10_000 })
}
