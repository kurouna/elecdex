import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ElectronApplication, Page } from '@playwright/test'
import { _electron as electron, expect, test } from '@playwright/test'

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
  /**
   * Quits the app and keeps the profile, for a test that starts a second one on
   * it. Guarded: an app that will not quit is killed rather than left to hold
   * the test until it times out, with nothing in the log to say so.
   */
  quit(): Promise<void>
  close(): Promise<void>
  /**
   * The lines main has warned so far ("[elecdex] metric os.info failed: ..."), for
   * a failure message: a pane left empty says nothing about why.
   */
  warnings(): string[]
}

export interface LaunchOptions {
  /** Play the boot sequence. Off by default so tests see the workspace at once. */
  intro?: boolean
  /**
   * Where the weather widget fetches JMA data from. Defaults to a closed local
   * port, so no test ever sends a request to the real JMA site.
   */
  jmaBaseUrl?: string
  /** Where the ORBIT pane asks CelesTrak; a closed port unless a spec serves elements. */
  celestrakBaseUrl?: string
  /** A layout.json to start from, instead of the default layout. */
  layout?: unknown
  /** Extra environment variables for the app. */
  env?: Record<string, string>
  /** Extra command-line switches for Electron, e.g. --lang=en-US. */
  args?: string[]
  /**
   * A settings.json to start from. Sound is off unless these settings say
   * otherwise, so running the suite does not beep at whoever is sitting at the
   * machine.
   */
  settings?: unknown
}

const QUIET = { sound: { enabled: false } }

/**
 * The settings a test gave, over sound off: a test that sets something else
 * (the layout question, say) must not bring the app's sounds back with it -
 * four layout tests played every switch aloud that way.
 */
function quietly(settings: unknown): unknown {
  if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
    return settings ?? QUIET
  }
  return { ...QUIET, ...settings }
}

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
const UNREACHABLE_CELESTRAK = 'http://127.0.0.1:9/celestrak'
/** No Claude Code folder: the AI AGENT pane must never read this machine's sessions in a test. */
const NO_CLAUDE_DIR = path.join(tmpdir(), 'elecdex-e2e-no-claude')
/** The web pane presets likewise open a closed port: no test loads YouTube or X. */
const UNREACHABLE_WEB =
  'youtube=http://127.0.0.1:9/youtube/,youtubetv=http://127.0.0.1:9/tv/,x=http://127.0.0.1:9/x/'

/**
 * Deletes a throwaway userData folder. Windows can keep a file in it locked for a
 * moment after the app exits (EPERM); retry, and leave a stubborn temp folder
 * behind rather than fail a test that passed.
 */
/** The live layout as main last wrote it, or null before its first save. */
export function savedLayout(userData: string): string | null {
  const file = path.join(userData, 'layout.json')
  return existsSync(file) ? readFileSync(file, 'utf8') : null
}

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
 * Longer than this and a launch or a quit is worth a line in the log.
 *
 * Both are a second or two on an idle machine. A test that times out inside one
 * prints no call log - there is no locator to report - so without this there is
 * nothing to say which of them it was hanging in.
 */
const SLOW_MS = 8_000

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
  const started = Date.now()
  const watchdog = setTimeout(
    () => console.warn(`[e2e] the app is still quitting after ${SLOW_MS / 1000}s`),
    SLOW_MS,
  )
  const closed = await Promise.race([
    app.close().then(() => true),
    new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), CLOSE_TIMEOUT_MS)
    }),
  ])
  clearTimeout(timer)
  clearTimeout(watchdog)
  // A close that took seconds but did finish leaves no other trace, and it is
  // what a test that timed out with no call log was most likely waiting on.
  const took = Date.now() - started
  if (took > SLOW_MS) console.warn(`[e2e] the app took ${(took / 1000).toFixed(1)}s to quit`)
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
    writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(quietly(options.settings)))
  }
  if (options.layout !== undefined) {
    writeFileSync(path.join(dir, 'layout.json'), JSON.stringify(options.layout))
  }
  const args = [MAIN, '--windowed', `--user-data-dir=${dir}`]
  if (!options.intro) args.push('--no-intro')
  if (options.args) args.push(...options.args)
  const startedAt = Date.now()
  // Said while it is still happening, not after: a test that times out inside a
  // launch never reaches the line below, and a timeout there prints no call log
  // (there is no locator to report), so this is the only thing that would name it.
  const watchdog = setTimeout(
    () => console.warn(`[e2e] the app is still coming up after ${SLOW_MS / 1000}s`),
    SLOW_MS,
  )
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
      ELECDEX_CELESTRAK_BASE_URL: options.celestrakBaseUrl ?? UNREACHABLE_CELESTRAK,
      // The AI AGENT pane reads Claude Code's own folder; a test gives it a made-up one.
      ELECDEX_CLAUDE_DIR: NO_CLAUDE_DIR,
      ELECDEX_WEB_HOMES: UNREACHABLE_WEB,
      // A steady tone and a made-up mixer: never the machine's sound or volume.
      ELECDEX_AUDIO_STUB: '1',
      // An in-memory tray, shortcut and sign-in entry: never the machine's taskbar,
      // keys or Run key (src/main/background).
      ELECDEX_BACKGROUND_STUB: '1',
      // A made-up socket table: never where this machine has actually been
      // (src/services/metrics/sockets/stub.ts).
      ELECDEX_SOCKETS_STUB: '1',
      // A made-up Wi-Fi link, echoes and log: never this machine's network, its
      // addresses or where it has connected, and no ping leaves the machine
      // (src/services/metrics/wifi/stub.ts).
      ELECDEX_WIFI_STUB: '1',
      // A stand-in clipboard: never what this machine has copied, and nothing put on
      // its clipboard (src/main/clipboard/stub.ts). Specs copy through
      // globalThis.__elecdexClipboard.
      ELECDEX_CLIPBOARD_STUB: '1',
      // A stand-in media session: never what this machine is playing, and no player's
      // button pressed (src/main/media/stub.ts). Specs change the track through
      // globalThis.__elecdexNowPlaying.
      ELECDEX_NOWPLAYING_STUB: '1',
      // A stand-in power-save blocker and power source: no run keeps this machine awake
      // (src/main/awake/stub.ts). Specs read the hold through globalThis.__elecdexAwake.
      ELECDEX_AWAKE_STUB: '1',
      // A reversible stand-in for the system's encryption: never the Keychain or a
      // keyring, and never the prompt either may show (src/main/ai/keys.ts).
      ELECDEX_AI_KEYS_STUB: '1',
      // A new profile starts with no saved layouts, as every spec but the presets' own
      // expects; a real first start is given the presets (shared/layout-presets.ts).
      ELECDEX_SEED_LAYOUTS: '0',
      ...options.env,
    },
  })
  const warnings: string[] = []
  app.process().stderr?.on('data', (chunk: Buffer) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line.includes('[elecdex]') && warnings.length < 200) warnings.push(line.trim())
    }
  })
  const page = await app.firstWindow()
  // An exception in the page says nothing in a test's failure: printed here, a pane that
  // stopped updating after one shows why in the run's output.
  page.on('pageerror', (error) => console.warn(`[e2e] page error: ${error.message}`))
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
  const platform = await app.evaluate(() => process.platform)
  clearTimeout(watchdog)
  const took = Date.now() - startedAt
  if (took > SLOW_MS) console.warn(`[e2e] the app took ${(took / 1000).toFixed(1)}s to come up`)

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
    quit: () => closeApp(app),
    warnings: () => [...warnings],
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
