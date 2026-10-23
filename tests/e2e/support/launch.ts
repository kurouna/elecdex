import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ElectronApplication, Page } from '@playwright/test'
import { _electron as electron, expect } from '@playwright/test'

export const MAIN = fileURLToPath(new URL('../../../out/main/index.js', import.meta.url))

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
  /**
   * Files to find in the profile at the first start, by path inside it, written as they are (a
   * broken settings.json, an awake.json). Saves a launch made only to create the folder.
   */
  files?: Record<string, string>
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

/** The live layout as main last wrote it, or null before its first save. */
export function savedLayout(userData: string): string | null {
  const file = path.join(userData, 'layout.json')
  return existsSync(file) ? readFileSync(file, 'utf8') : null
}

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
/**
 * The text on the machine's clipboard when each app came up, put back as it quits: shell tests
 * copy and paste through the real clipboard, and the suite must not leave what whoever runs it
 * had copied overwritten. Only text: Electron cannot read every format back.
 */
const clipboardAtLaunch = new WeakMap<ElectronApplication, string>()

/** `app.evaluate`, given up after a moment: an app that hangs must not hold a launch or a quit. */
function briefly<T>(work: Promise<T>): Promise<T | undefined> {
  let timer: NodeJS.Timeout | undefined
  return Promise.race([
    work.catch(() => undefined),
    new Promise<undefined>((resolve) => {
      timer = setTimeout(() => resolve(undefined), 2000)
    }),
  ]).finally(() => clearTimeout(timer))
}

async function closeApp(app: ElectronApplication): Promise<void> {
  const child = app.process()
  const before = clipboardAtLaunch.get(app)
  if (before !== undefined) {
    await briefly(app.evaluate(({ clipboard }, text) => clipboard.writeText(text), before))
  }
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

/**
 * What every launch of the app in a test is given: closed ports for every service, and a
 * stand-in for everything of this machine's (CLAUDE.md, Tests). A spec that starts the app
 * itself spreads this in too.
 */
export const STUB_ENV: Record<string, string> = {
  ELECDEX_JMA_BASE_URL: UNREACHABLE_JMA,
  ELECDEX_MET_BASE_URL: UNREACHABLE_MET,
  ELECDEX_NWS_BASE_URL: UNREACHABLE_NWS,
  ELECDEX_MARKETS_STUB_URL: UNREACHABLE_MARKETS,
  ELECDEX_UPDATES_URL: UNREACHABLE_UPDATES,
  ELECDEX_USGS_BASE_URL: UNREACHABLE_USGS,
  ELECDEX_NOAA_BASE_URL: UNREACHABLE_NOAA,
  ELECDEX_CELESTRAK_BASE_URL: UNREACHABLE_CELESTRAK,
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
  // A made-up wired link and its echoes: never this machine's adapters or
  // addresses, and no ping leaves the machine (src/services/metrics/ethernet/stub.ts).
  ELECDEX_ETHER_STUB: '1',
  // A stand-in clipboard: never what this machine has copied, and nothing put on
  // its clipboard (src/main/clipboard/stub.ts). Specs copy through
  // globalThis.__elecdexClipboard.
  ELECDEX_CLIPBOARD_STUB: '1',
  // A stand-in media session: never what this machine is playing, and no player's
  // button pressed (src/main/media/stub.ts). Specs change the track through
  // globalThis.__elecdexNowPlaying.
  ELECDEX_NOWPLAYING_STUB: '1',
  // A stand-in Docker engine: never this machine's containers, and none started or
  // stopped (src/main/docker/stub.ts). Specs change it through globalThis.__elecdexDocker.
  ELECDEX_DOCKER_STUB: '1',
  // A stand-in power-save blocker and power source: no run keeps this machine awake
  // (src/main/awake/stub.ts). Specs read the hold through globalThis.__elecdexAwake.
  ELECDEX_AWAKE_STUB: '1',
  // A reversible stand-in for the system's encryption: never the Keychain or a
  // keyring, and never the prompt either may show (src/main/ai/keys.ts).
  ELECDEX_AI_KEYS_STUB: '1',
  // A made-up GPU: every machine draws the same panes - CI's runners have none - and the
  // GPU lane, lamp and slot are always in CLUSTER (src/services/metrics/gpu/stub.ts).
  ELECDEX_GPU_STUB: '1',
  // The internet echo of the network panes goes to this machine, not to 1.1.1.1
  // (src/services/metrics/ping-host.ts).
  ELECDEX_PING_HOST: '127.0.0.1',
  // A new profile starts with no saved layouts, as every spec but the presets' own
  // expects; a real first start is given the presets (shared/layout-presets.ts).
  ELECDEX_SEED_LAYOUTS: '0',
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
  for (const [name, text] of Object.entries(options.files ?? {})) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    writeFileSync(path.join(dir, name), text)
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
      ...STUB_ENV,
      ELECDEX_JMA_BASE_URL: options.jmaBaseUrl ?? UNREACHABLE_JMA,
      ELECDEX_CELESTRAK_BASE_URL: options.celestrakBaseUrl ?? UNREACHABLE_CELESTRAK,
      ...options.env,
    },
  })
  const clipboardText = await briefly(app.evaluate(({ clipboard }) => clipboard.readText()))
  if (clipboardText !== undefined) clipboardAtLaunch.set(app, clipboardText)
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
  // `--no-intro` is checked here, by every launch that passes it: the boot sequence never
  // starts, so nothing of it covers the workspace a test is about to use.
  if (!options.intro) await expect(page.getByTestId('app')).toHaveAttribute('data-boot', 'done')
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
 * Launches on two saved layouts, the first of them the one being worked in (Ctrl+Shift+1 and
 * 2 go to them): what a switch between layouts is tested on. Their ids are main's to check
 * (/^[a-z0-9]{4,32}$/; any other is dropped), and their trees go in as they are, so two may
 * hold panes of the same id - as a layout kept under a new name ("save as") does.
 */
export async function launchOnTwoLayouts(
  first: unknown,
  second: unknown,
  options: Omit<LaunchOptions, 'layout'> = {},
): Promise<Launched> {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-e2e-'))
  writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(quietly(options.settings)))
  writeFileSync(path.join(dir, 'layout.json'), JSON.stringify(first))
  const items = [
    { id: 'layouta', name: 'one', tree: first },
    { id: 'layoutb', name: 'two', tree: second },
  ]
  writeFileSync(
    path.join(dir, 'layouts.json'),
    JSON.stringify({ version: 1, items, active: 'layouta' }),
  )
  const launched = await launch(dir, options)
  return {
    ...launched,
    close: async () => {
      await launched.close()
      removeDir(dir)
    },
  }
}

/** Resolves once the app's process has ended (at once if it already has). */
export function exited(app: ElectronApplication): Promise<void> {
  const child = app.process()
  if (child.exitCode !== null) return Promise.resolve()
  return new Promise((resolve) => child.once('exit', () => resolve()))
}

/** The CPU seconds every process of the app has used so far, together. */
export const cpuSeconds = (app: ElectronApplication) =>
  app.evaluate(({ app: electronApp }) =>
    electronApp.getAppMetrics().reduce((sum, m) => sum + (m.cpu.cumulativeCPUUsage ?? 0), 0),
  )
