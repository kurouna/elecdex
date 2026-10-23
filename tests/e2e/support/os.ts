import type { ElectronApplication, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/** Whether the window is minimised, as the platform has it. */
const minimised = (app: ElectronApplication) =>
  app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows().some((win) => win.isMinimized()),
  )

/**
 * Puts the window away and waits for the page to notice, for a test about what
 * happens - or does not - while nobody is looking.
 *
 * Minimising belongs to the window manager, not to the app. A session with none
 * (a bare Xvfb, which is what a headless runner has unless a window manager is
 * started beside it) leaves the window where it is and never reports it
 * minimised, so main never tells the page (src/main/window.ts) and there is
 * nothing here to test. The test is skipped there rather than failing on a bare
 * "0 elements", and the two steps are told apart in the log: the platform not
 * minimising the window is the session's doing, the page not hearing about a
 * window that *is* minimised is ours.
 */
export async function putWindowAway(app: ElectronApplication, page: Page): Promise<void> {
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()
      .find((win) => win.isVisible())
      ?.minimize(),
  )
  const went = await expect
    .poll(() => minimised(app), { timeout: 5_000 })
    .toBe(true)
    .then(() => true)
    .catch(() => false)
  if (!went) console.warn('[e2e] the window did not minimise: no window manager in this session?')
  test.skip(!went, 'the window cannot be minimised here')
  await expect(
    page.locator(':root[data-offscreen]'),
    'the window is minimised, but the page was not told (system.windowStateChanged)',
  ).toHaveCount(1)
}

/**
 * Where the machine's power comes from and how full its battery is, in words, for a
 * test that measures CPU time to print beside its figures and its failure.
 *
 * On battery, and below 20% in particular, Windows moves work to the efficiency cores
 * and the same work costs more CPU seconds: on 2026-10-01 the idle default layout
 * measured 50% of one core on battery at 17%, and 24% on AC power at 47% - the same
 * build, the budget 40. The source is main's (`powerMonitor`); the level is the page's
 * Battery Status API, which main has no counterpart of. A machine without a battery
 * reads as a full one, charging.
 */
export async function powerNote(app: ElectronApplication, page: Page): Promise<string> {
  const onBattery = await app.evaluate(({ powerMonitor }) => powerMonitor.isOnBatteryPower())
  const battery = await page.evaluate(async () => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; charging: boolean }>
    }
    if (nav.getBattery === undefined) return null
    const { level, charging } = await nav.getBattery()
    return { level, charging }
  })
  const source = onBattery ? 'on battery' : 'on AC power'
  if (battery === null) return `${source}, battery level unknown`
  const state = battery.charging ? 'charging' : 'discharging'
  return `${source}, battery ${Math.round(battery.level * 100)}% (${state})`
}

/** Brings the window back from {@link putWindowAway} and waits for the page to hear of it. */
export async function bringWindowBack(app: ElectronApplication, page: Page): Promise<void> {
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()
      .find((win) => win.isMinimized())
      ?.restore(),
  )
  await expect(
    page.locator(':root[data-offscreen]'),
    'the window is back, but the page is still drawing nothing',
  ).toHaveCount(0)
}

/** Makes main's next file or folder picker answer `answer` (a path), as a person picking it. */
export async function pickerAnswers(app: ElectronApplication, answer: string): Promise<void> {
  await app.evaluate(({ dialog }, picked) => {
    dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [picked] })) as never
  }, answer)
}

/**
 * Makes main's save dialogs answer `answer` (a path), or cancel with null, and answers how
 * each was opened: over the elecdex window (`owned`), or as a window of its own.
 */
export async function saveDialogAnswers(
  app: ElectronApplication,
  answer: string | null,
): Promise<() => Promise<{ owned: boolean }[]>> {
  await app.evaluate(({ BrowserWindow, dialog }, filePath) => {
    const opened: { owned: boolean }[] = []
    ;(globalThis as { __saveDialogs?: unknown }).__saveDialogs = opened
    dialog.showSaveDialog = (async (...args: unknown[]) => {
      opened.push({ owned: args.length === 2 && args[0] instanceof BrowserWindow })
      return { canceled: filePath === null, filePath: filePath ?? '' }
    }) as never
  }, answer)
  return () =>
    app.evaluate(() => (globalThis as { __saveDialogs?: { owned: boolean }[] }).__saveDialogs ?? [])
}

/**
 * Makes the page's copies (`navigator.clipboard.writeText`, the COPY buttons) land in a list
 * instead of the machine's clipboard, and answers that list: a test about what a report says
 * must not overwrite what whoever runs the suite has copied.
 */
export async function catchPageCopies(page: Page): Promise<() => Promise<string[]>> {
  await page.evaluate(() => {
    const copies: string[] = []
    ;(globalThis as { __e2eCopies?: string[] }).__e2eCopies = copies
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      value: async (text: string) => {
        copies.push(text)
      },
    })
  })
  return () => page.evaluate(() => (globalThis as { __e2eCopies?: string[] }).__e2eCopies ?? [])
}
