import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { ElectronApplication, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { type Launched, launch } from './support.js'

/** The version being built, so this test does not need editing on every release. */
const PACKAGE_VERSION = (
  JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
    version: string
  }
).version

let launched: Launched
let app: ElectronApplication
let page: Page

// A throwaway profile, as every other launch: this spec once ran on the machine's own elecdex
// profile so that Electron would name the userData folder itself, and read and wrote the
// layout and settings of whoever ran the suite. The name is checked without it below.
test.beforeAll(async () => {
  launched = await launch()
  app = launched.app
  page = launched.page
})

test.afterAll(async () => {
  await launched?.close()
})

test('the window opens and the workspace renders', async () => {
  await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
  await expect(page.getByTestId('pane').first()).toBeVisible()
})

test('the preload bridge answers system.info', async () => {
  const info = await page.evaluate(() => window.elecdex.system.info())
  expect(info.name).toBe('elecdex')
  expect(info.versions.electron).toMatch(/^\d+\./)
})

test('the renderer has no node access and no remote', async () => {
  const exposure = await page.evaluate(() => ({
    require: typeof (globalThis as Record<string, unknown>).require,
    process: typeof (globalThis as Record<string, unknown>).process,
    module: typeof (globalThis as Record<string, unknown>).module,
    ipcRenderer: typeof (window.elecdex as unknown as Record<string, unknown>).ipcRenderer,
  }))
  expect(exposure).toEqual({
    require: 'undefined',
    process: 'undefined',
    module: 'undefined',
    ipcRenderer: 'undefined',
  })
})

test('the window is configured for an isolated, sandboxed renderer', async () => {
  const prefs = await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows()
    if (!win) throw new Error('no window')
    // @ts-expect-error - reading the private prefs snapshot is intentional here.
    const wp = win.webContents.getLastWebPreferences() ?? {}
    return {
      sandbox: wp.sandbox,
      contextIsolation: wp.contextIsolation,
      nodeIntegration: wp.nodeIntegration,
      webSecurity: wp.webSecurity,
    }
  })
  expect(prefs.sandbox).not.toBe(false)
  expect(prefs.contextIsolation).not.toBe(false)
  expect(prefs.nodeIntegration).not.toBe(true)
  expect(prefs.webSecurity).not.toBe(false)
})

test("config lives in an elecdex-named userData dir, not Electron's", async () => {
  // The folder Electron would choose without --user-data-dir is appData joined with the app's
  // name, which out/ (no package.json) would leave as "Electron" unless main names it first.
  const { name, appData } = await app.evaluate(({ app: electronApp }) => ({
    name: electronApp.getName(),
    appData: electronApp.getPath('appData'),
  }))
  expect(name).toBe('elecdex')
  expect(path.join(appData, name).toLowerCase()).toContain(`${path.sep}elecdex`)
})

test('reports the package version, not the Electron version', async () => {
  const info = await page.evaluate(() => window.elecdex.system.info())
  expect(info.version).toBe(PACKAGE_VERSION)
  expect(info.version).not.toBe(info.versions.electron)
})

test("has no menu of Electron's, so its own keys reach nothing", async () => {
  // Found in review: the default menu's Ctrl+R reloaded the workspace and Ctrl+0/=/- zoomed it
  // when a web pane or a dialog had the keys and did not use them. macOS has the app and Edit
  // menus it expects (issue 18), and nothing that reloads or zooms.
  const menu = await app.evaluate(({ Menu }) => {
    const roles: string[] = []
    const walk = (items: Electron.MenuItem[]): void => {
      for (const item of items) {
        roles.push(String(item.role ?? '').toLowerCase())
        if (item.submenu) walk(item.submenu.items)
      }
    }
    const current = Menu.getApplicationMenu()
    if (current !== null) walk(current.items)
    return { present: current !== null, roles }
  })
  expect(menu.present).toBe(process.platform === 'darwin')
  if (process.platform === 'darwin')
    expect(menu.roles).toEqual(expect.arrayContaining(['copy', 'paste']))
  for (const role of [
    'reload',
    'forcereload',
    'resetzoom',
    'zoomin',
    'zoomout',
    'toggledevtools',
  ]) {
    expect(menu.roles).not.toContain(role)
  }
  await page.evaluate(() => {
    ;(window as unknown as { __kept: number }).__kept = 1
  })
  await page.keyboard.press('Control+r')
  await page.keyboard.press('Control+Equal')
  await page.waitForTimeout(800)
  expect(await page.evaluate(() => (window as unknown as { __kept?: number }).__kept)).toBe(1)
  expect(
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.webContents.getZoomLevel(),
    ),
  ).toBe(0)
})

test('reveals only the files main knows, and takes no path from the page', async () => {
  // Found in the sweep: a reveal channel showed any path the page named.
  await app.evaluate(({ shell }) => {
    const shown: string[] = []
    ;(globalThis as unknown as { __shown: string[] }).__shown = shown
    shell.showItemInFolder = (file: string) => {
      shown.push(file)
    }
  })
  expect(await page.evaluate(() => 'revealInFolder' in (window.elecdex.system as object))).toBe(
    false,
  )
  await page.evaluate(async () => {
    await window.elecdex.layout.saved.reveal()
    await window.elecdex.themes.reveal()
    await window.elecdex.layout.reveal()
  })
  const shown = await app.evaluate(() => (globalThis as unknown as { __shown: string[] }).__shown)
  expect(shown).toHaveLength(3)
  expect(shown[0]).toMatch(/layouts\.json$/)
  expect(shown[1]).toMatch(/themes$/)
  expect(shown[2]).toMatch(/layout\.json$/)
})
