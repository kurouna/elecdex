import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ElectronApplication, Page } from '@playwright/test'
import { _electron as electron, expect } from '@playwright/test'

export const MAIN = fileURLToPath(new URL('../../out/main/index.js', import.meta.url))

/**
 * A running app with its own throwaway userData directory.
 *
 * Isolation matters now that the layout persists: without it, a layout saved by
 * one test (or by the developer's real use of the app) would silently change
 * what the next test sees.
 */
export interface Launched {
  app: ElectronApplication
  page: Page
  userData: string
  platform: NodeJS.Platform
  /** Relaunches against the same userData, to test what survives a restart. */
  relaunch(): Promise<Launched>
  close(): Promise<void>
}

export interface LaunchOptions {
  /** Play the boot sequence. Off by default so tests see the workspace at once. */
  intro?: boolean
  /**
   * Where the weather widget fetches JMA data from. Defaults to a closed local
   * port, so no test ever sends a request to the real JMA site.
   */
  jmaBaseUrl?: string
  /** A layout.json to start from, instead of the default layout. */
  layout?: unknown
  /** Extra environment variables for the app. */
  env?: Record<string, string>
  /** Extra command-line switches for Electron, e.g. --lang=en-US. */
  args?: string[]
  /**
   * A settings.json to start from. By default sound is off, so running the suite
   * does not beep at whoever is sitting at the machine.
   */
  settings?: unknown
}

const QUIET = { sound: { enabled: false } }

/** One terminal filling the window: for tests about terminals and splitting, not the default layout. */
export const SINGLE_TERMINAL = {
  version: 1,
  root: { kind: 'pane', id: 'term', widget: 'terminal' },
} as const

const UNREACHABLE_JMA = 'http://127.0.0.1:9/bosai'
/** MET Norway and the NWS likewise: no test asks a real weather service. */
const UNREACHABLE_MET = 'http://127.0.0.1:9/weatherapi'
const UNREACHABLE_NWS = 'http://127.0.0.1:9/nws'
/** Markets likewise read from a closed port unless a test serves them: no test contacts Yahoo. */
const UNREACHABLE_MARKETS = 'http://127.0.0.1:9/markets'
/** And the update check never asks GitHub. */
const UNREACHABLE_UPDATES = 'http://127.0.0.1:9/releases/latest'
/** Earthquakes and tsunamis abroad likewise: no test asks the USGS or NOAA. */
const UNREACHABLE_USGS = 'http://127.0.0.1:9/usgs'
const UNREACHABLE_NOAA = 'http://127.0.0.1:9/noaa'
/** The web pane presets likewise open a closed port: no test loads YouTube or X. */
const UNREACHABLE_WEB =
  'youtube=http://127.0.0.1:9/youtube/,youtubetv=http://127.0.0.1:9/tv/,x=http://127.0.0.1:9/x/'

/**
 * Deletes a throwaway userData folder. Windows can keep a file in it locked for a
 * moment after the app exits (EPERM); retry, and leave a stubborn temp folder
 * behind rather than fail a test that passed.
 */
export function removeDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  } catch (error) {
    console.warn(`[e2e] could not remove ${dir}: ${(error as Error).message}`)
  }
}

/** How long a clean quit may take before the app is killed. */
const CLOSE_TIMEOUT_MS = 20_000

/**
 * Quits the app, and kills it (with its shells) if quitting hangs.
 *
 * On a loaded Windows CI runner, closing ConPTY sessions has occasionally kept
 * the app from exiting until Playwright's 60s teardown limit failed the run -
 * after every test had passed. A test that needs a clean quit asserts it itself
 * (exit.spec.ts); everywhere else a hung quit must not cost the suite.
 */
async function closeApp(app: ElectronApplication): Promise<void> {
  const child = app.process()
  let timer: NodeJS.Timeout | undefined
  const closed = await Promise.race([
    app.close().then(() => true),
    new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), CLOSE_TIMEOUT_MS)
    }),
  ])
  clearTimeout(timer)
  if (closed || child.pid === undefined) return
  console.warn(`[e2e] app did not quit within ${CLOSE_TIMEOUT_MS}ms; killing it`)
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    child.kill('SIGKILL')
  }
}

export async function launch(userData?: string, options: LaunchOptions = {}): Promise<Launched> {
  const dir = userData ?? mkdtempSync(path.join(tmpdir(), 'elecdex-e2e-'))
  // Only on a fresh directory: a relaunch keeps whatever the app saved.
  if (userData === undefined) {
    writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(options.settings ?? QUIET))
  }
  if (options.layout !== undefined) {
    writeFileSync(path.join(dir, 'layout.json'), JSON.stringify(options.layout))
  }
  const args = [MAIN, '--windowed', `--user-data-dir=${dir}`]
  if (!options.intro) args.push('--no-intro')
  if (options.args) args.push(...options.args)
  const app = await electron.launch({
    args,
    env: {
      ...process.env,
      ELECDEX_JMA_BASE_URL: options.jmaBaseUrl ?? UNREACHABLE_JMA,
      ELECDEX_MET_BASE_URL: UNREACHABLE_MET,
      ELECDEX_NWS_BASE_URL: UNREACHABLE_NWS,
      ELECDEX_MARKETS_STUB_URL: UNREACHABLE_MARKETS,
      ELECDEX_UPDATES_URL: UNREACHABLE_UPDATES,
      ELECDEX_USGS_BASE_URL: UNREACHABLE_USGS,
      ELECDEX_NOAA_BASE_URL: UNREACHABLE_NOAA,
      ELECDEX_WEB_HOMES: UNREACHABLE_WEB,
      // A steady tone and a made-up mixer: never the machine's sound or volume.
      ELECDEX_AUDIO_STUB: '1',
      // An in-memory tray, shortcut and sign-in entry: never the machine's taskbar,
      // keys or Run key (src/main/background).
      ELECDEX_BACKGROUND_STUB: '1',
      // A made-up socket table: never where this machine has actually been
      // (src/services/metrics/sockets/stub.ts).
      ELECDEX_SOCKETS_STUB: '1',
      ...options.env,
    },
  })
  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
  const platform = await app.evaluate(() => process.platform)

  const launched: Launched = {
    app,
    page,
    userData: dir,
    platform,
    relaunch: async () => {
      await closeApp(app)
      // The seeded layout was only for the first start; keep what the app saved.
      const { layout: _seeded, ...rest } = options
      return launch(dir, rest)
    },
    close: async () => {
      await closeApp(app)
      if (userData === undefined) removeDir(dir)
    },
  }
  return launched
}

/**
 * Terminal panes that are on screen. Background tabs stay mounted (their shells
 * keep running) but are not displayed, so they are left out.
 */
export const terminalPane = (page: Page) =>
  page.locator('[data-testid=pane][data-widget=terminal]:not(.hidden)')

/** Types a command into a terminal pane and presses Enter. */
export async function typeInto(page: Page, pane: ReturnType<Page['locator']>, text: string) {
  await pane.locator('.xterm-helper-textarea').first().focus()
  await page.keyboard.type(text)
  await page.keyboard.press('Enter')
}

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
