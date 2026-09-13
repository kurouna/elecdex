import { fileURLToPath } from 'node:url'
import type { ElectronApplication, Page } from '@playwright/test'
import { _electron as electron, expect, test } from '@playwright/test'

const MAIN = fileURLToPath(new URL('../../out/main/index.js', import.meta.url))

let app: ElectronApplication
let page: Page

test.beforeAll(async () => {
  app = await electron.launch({
    args: [MAIN, '--windowed', '--no-intro'],
    // A closed port: this spec must not send requests to the real JMA site.
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ELECDEX_JMA_BASE_URL: 'http://127.0.0.1:9/bosai',
      ELECDEX_MARKETS_STUB_URL: 'http://127.0.0.1:9/markets',
    },
  })
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await app?.close()
})

// This spec deliberately runs against the default userData directory rather
// than an isolated one: the userData-name check below is only meaningful when
// Electron is left to resolve the path itself. Everything that depends on
// persisted layout lives in layout.spec.ts, which isolates.

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
  const userData = await app.evaluate(({ app: electronApp }) => electronApp.getPath('userData'))
  expect(userData.toLowerCase()).toContain('elecdex')
})

test('reports the package version, not the Electron version', async () => {
  const info = await page.evaluate(() => window.elecdex.system.info())
  expect(info.version).toBe('0.0.1')
  expect(info.version).not.toBe(info.versions.electron)
})
