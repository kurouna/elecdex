import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { test as base, expect } from '@playwright/test'
import { defaultLayout } from '../../../src/shared/default-layout.js'
import { type Launched, type LaunchOptions, launch } from './launch.js'

/**
 * One app shared by the tests of a worker that start from the same launch (docs/e2e-design.md,
 * section 4.1). A test asks `shared({ layout, settings, ... })`; the first gets a fresh app, the
 * next one with the same options (the layout aside) gets the same app put back: its sessions
 * ended, main's dialogs and shell given back what a test replaced, the window as it came up, the
 * test's layout saved and the page reloaded. What cannot be put back is checked instead - the
 * settings, the saved layouts and every file main keeps in the profile - and an app that is not
 * as it came up is quit and started afresh, so a test never sees what an earlier one left behind.
 *
 * Only for tests whose launch options carry no environment or command line of their own that
 * the next test would not want, and that do not leave state in main's memory the checks cannot
 * see (the clipboard's history, a stand-in's presses, a web page's session): those launch their
 * own app. A test that relaunches or quits the app launches its own too.
 */

/** What a test may ask of the shared app: a launch, the layout being put back between tests. */
export type SharedOptions = Pick<
  LaunchOptions,
  'layout' | 'settings' | 'env' | 'args' | 'files' | 'jmaBaseUrl' | 'celestrakBaseUrl'
>

/** Chromium's own folders and files in a profile: none of them is main's. */
const CHROMIUM =
  /^(Cache|Code Cache|GPUCache|GPUPersistentCache|GrShaderCache|ShaderCache|Dawn\w*|Local Storage|Session Storage|Network|blob_storage|Shared Dictionary|SharedStorage|IndexedDB|Partitions|WebStorage|Crashpad|Service Worker|Extension State|VideoDecodeStats|shared_proto_db|databases|Dictionaries|Trust Tokens|Local State|Preferences|DIPS.*|DevToolsActivePort|lockfile|declarative_performance_observer.*|.*\.log|Cookies.*|Network Persistent State|TransportSecurity)$/

/** Files main manages through APIs the reset checks directly, or rewrites as it runs. */
const CHECKED_ELSEWHERE = new Set(['layout.json', 'layouts.json', 'settings.json'])

/** Every file main keeps in the profile, with a hash of what it holds. */
function profileFiles(dir: string, under = ''): Record<string, string> {
  const found: Record<string, string> = {}
  if (!existsSync(dir)) return found
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (under === '' && (CHROMIUM.test(entry.name) || CHECKED_ELSEWHERE.has(entry.name))) continue
    const full = path.join(dir, entry.name)
    const name = under === '' ? entry.name : `${under}/${entry.name}`
    if (entry.isDirectory()) Object.assign(found, profileFiles(full, name))
    else if (entry.isFile() && statSync(full).size < 8_000_000) {
      found[name] = createHash('sha1').update(readFileSync(full)).digest('hex')
    }
  }
  return found
}

interface Baseline {
  settings: unknown
  saved: unknown
  files: Record<string, string>
  bounds: unknown
}

/** The pane ids of a layout tree, in order. */
function paneIds(node: unknown): string[] {
  const n = node as { kind?: string; id?: string; children?: unknown[] }
  if (n?.kind === 'pane') return [n.id ?? '']
  return (n?.children ?? []).flatMap(paneIds)
}

class Pool {
  private launched: Launched | null = null
  private key = ''
  private baseline: Baseline | null = null
  /** Whether a test has had the app since it was put back. */
  private used = false
  /** How many tests the app served, and how many fresh launches it took, for the run's log. */
  served = 0
  launches = 0

  async take(options: SharedOptions): Promise<Launched> {
    const { layout, ...launchOnly } = options
    const key = JSON.stringify(launchOnly)
    const tree = layout ?? defaultLayout()
    if (this.launched !== null && this.key === key && this.used) {
      const reason = await this.putBack(tree).catch((error: Error) => error.message)
      if (reason !== null) {
        console.warn(`[e2e] the shared app was started afresh: ${reason}`)
        await this.drop()
      }
    } else if (this.launched !== null && this.key !== key) {
      await this.drop()
    }
    if (this.launched === null) {
      this.launched = await launch(undefined, { ...launchOnly, ...(layout ? { layout } : {}) })
      this.key = key
      this.launches += 1
      await this.remember()
    }
    this.used = true
    this.served += 1
    const launched = this.launched
    // Closed by the pool, not by the test: a test that closes "its" app hands it back.
    return { ...launched, close: async () => {}, quit: async () => {} }
  }

  /** What the app is like as it came up: kept to compare against after each test. */
  private async remember(): Promise<void> {
    const { app, page, userData } = this.launched as Launched
    await app.evaluate(({ dialog, shell }) => {
      const kept = globalThis as { __e2eOriginals?: Record<string, unknown> }
      kept.__e2eOriginals = {
        showOpenDialog: dialog.showOpenDialog,
        showSaveDialog: dialog.showSaveDialog,
        showMessageBox: dialog.showMessageBox,
        openExternal: shell.openExternal,
        openPath: shell.openPath,
        showItemInFolder: shell.showItemInFolder,
      }
    })
    this.baseline = {
      settings: await page.evaluate(() => window.elecdex.settings.get()),
      saved: await page.evaluate(() => window.elecdex.layout.saved.list()),
      files: profileFiles(userData),
      bounds: await this.bounds(),
    }
  }

  private bounds() {
    return (this.launched as Launched).app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows().find((w) => w.isVisible() || w.isMinimized())
      return win ? { size: win.getContentSize(), zoom: win.webContents.getZoomFactor() } : null
    })
  }

  /** Puts the app back for the next test; answers why it could not, or null. */
  private async putBack(tree: unknown): Promise<string | null> {
    const { app, page, userData } = this.launched as Launched
    const baseline = this.baseline as Baseline
    if (app.process().exitCode !== null) return 'it had quit'
    // Main given back what a test replaced, and the window as it came up.
    await app.evaluate(({ BrowserWindow, dialog, shell }, size) => {
      const kept = (globalThis as { __e2eOriginals?: Record<string, unknown> }).__e2eOriginals ?? {}
      Object.assign(dialog, {
        showOpenDialog: kept.showOpenDialog,
        showSaveDialog: kept.showSaveDialog,
        showMessageBox: kept.showMessageBox,
      })
      Object.assign(shell, {
        openExternal: kept.openExternal,
        openPath: kept.openPath,
        showItemInFolder: kept.showItemInFolder,
      })
      const win = BrowserWindow.getAllWindows().find((w) => w.isVisible() || w.isMinimized())
      if (!win) return
      if (win.isMinimized()) win.restore()
      if (win.isFullScreen()) win.setFullScreen(false)
      win.webContents.setZoomFactor(1)
      const content = (size as { size?: [number, number] } | null)?.size
      if (content) win.setContentSize(content[0], content[1])
    }, baseline.bounds)
    // Every shell ended, the test's layout in place, and a fresh page on it.
    await page.evaluate(async () => {
      for (const s of await window.elecdex.pty.list()) await window.elecdex.pty.dispose(s.id)
    })
    // A save of the page's own still pending is written as it unloads, over the tree put back:
    // then it is put back again.
    const wanted = paneIds((tree as { root: unknown }).root)
    let back = false
    for (let tries = 0; tries < 3 && !back; tries++) {
      await page.evaluate((t) => window.elecdex.layout.save(t as never), tree)
      await page.reload()
      await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
      const loaded = await page.evaluate(() => window.elecdex.layout.load())
      back = isDeepStrictEqual(paneIds(loaded.root), wanted)
    }
    if (!back) return 'the layout did not come back as saved'
    // The pointer to a corner: left where a test rested it, a hover there is no move and opens nothing.
    await page.mouse.move(0, 0)
    // What cannot be put back must not have changed.
    if (
      !isDeepStrictEqual(
        await page.evaluate(() => window.elecdex.settings.get()),
        baseline.settings,
      )
    ) {
      return 'a test changed the settings'
    }
    if (
      !isDeepStrictEqual(
        await page.evaluate(() => window.elecdex.layout.saved.list()),
        baseline.saved,
      )
    ) {
      return 'a test changed the saved layouts'
    }
    const files = profileFiles(userData)
    if (!isDeepStrictEqual(files, baseline.files)) {
      const changed = [...new Set([...Object.keys(files), ...Object.keys(baseline.files)])].filter(
        (f) => files[f] !== baseline.files[f],
      )
      return `a test changed main's files: ${changed.slice(0, 5).join(', ')}`
    }
    if (!isDeepStrictEqual(await this.bounds(), baseline.bounds))
      return 'the window did not come back'
    return null
  }

  async drop(): Promise<void> {
    const launched = this.launched
    this.launched = null
    this.baseline = null
    this.used = false
    await launched?.close()
  }
}

/**
 * Playwright's `test` with `shared`: call it in a test for an app started with those options,
 * shared with the tests before and after it that ask for the same.
 */
export const test = base.extend<
  { shared: (options?: SharedOptions) => Promise<Launched> },
  { pool: Pool }
>({
  pool: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright reads the fixtures a function takes from its first parameter.
    async ({}, use) => {
      const pool = new Pool()
      await use(pool)
      await pool.drop()
      if (pool.served > 0) {
        console.log(`[e2e] shared app: ${pool.served} tests on ${pool.launches} launches`)
      }
    },
    { scope: 'worker' },
  ],
  shared: async ({ pool }, use) => {
    await use((options = {}) => pool.take(options))
  },
})
