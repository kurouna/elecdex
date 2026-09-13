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
/** Markets likewise read from a closed port unless a test serves them: no test contacts Yahoo. */
const UNREACHABLE_MARKETS = 'http://127.0.0.1:9/markets'

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
  const app = await electron.launch({
    args,
    env: {
      ...process.env,
      ELECDEX_JMA_BASE_URL: options.jmaBaseUrl ?? UNREACHABLE_JMA,
      ELECDEX_MARKETS_STUB_URL: UNREACHABLE_MARKETS,
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
      await app.close()
      // The seeded layout was only for the first start; keep what the app saved.
      const { layout: _seeded, ...rest } = options
      return launch(dir, rest)
    },
    close: async () => {
      await app.close()
      if (userData === undefined) rmSync(dir, { recursive: true, force: true })
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
