import { mkdtempSync, rmSync } from 'node:fs'
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
}

export async function launch(userData?: string, options: LaunchOptions = {}): Promise<Launched> {
  const dir = userData ?? mkdtempSync(path.join(tmpdir(), 'elecdex-e2e-'))
  const args = [MAIN, '--windowed', `--user-data-dir=${dir}`]
  if (!options.intro) args.push('--no-intro')
  const app = await electron.launch({ args })
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
      return launch(dir, options)
    },
    close: async () => {
      await app.close()
      if (userData === undefined) rmSync(dir, { recursive: true, force: true })
    },
  }
  return launched
}

/** The pane hosting the (first) terminal in the default layout. */
export const terminalPane = (page: Page) => page.locator('[data-testid=pane][data-widget=terminal]')

/** Types a command into a terminal pane and presses Enter. */
export async function typeInto(page: Page, pane: ReturnType<Page['locator']>, text: string) {
  await pane.locator('.xterm-helper-textarea').first().focus()
  await page.keyboard.type(text)
  await page.keyboard.press('Enter')
}
