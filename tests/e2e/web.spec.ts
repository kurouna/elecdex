import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { type Launched, type LaunchOptions, launch } from './support.js'

/**
 * Web panes (the browser, YouTube and X presets) against a local server standing in
 * for the sites: 127.0.0.1 is "YouTube" and "X", and localhost is a site outside
 * them. No test here loads a real site.
 *
 * What only the running app can show: the page's view sits exactly over its pane,
 * steps aside for dialogs and hidden tabs, survives a reload of the workspace,
 * stays within its preset, takes the theme's tint, and gives shortcuts back.
 */

let server: Server
let port: number
const requests: string[] = []

const PAGE = (title: string, body = '') =>
  `<!doctype html><html><head><title>${title}</title></head>` +
  `<body style="margin:0;background:#fff;color:#000"><h1>${title}</h1>${body}</body></html>`

/** The stub site's pages: a status, headers and a body. */
function route(url: string): [number, Record<string, string>, string] {
  const html = { 'content-type': 'text/html' }
  const pages: Record<string, string> = {
    '/yt/': PAGE(
      'YT home',
      `<a id="next" href="/yt/next">next</a>
       <a id="away" href="http://localhost:${port}/away">away</a>
       <a id="blank" href="/yt/blank" target="_blank">blank</a>
       <a id="file" href="file:///C:/Windows/win.ini">file</a>
       <a id="saved" href="/yt/file.bin" download>file</a>
       <input id="field">`,
    ),
    '/yt/next': PAGE('YT next'),
    // No background and no colour scheme of its own: what the page's own defaults are
    // told decides whether it can be read at all.
    '/yt/bare': '<!doctype html><title>YT bare</title><h1>bare page</h1><p>plain text</p>',
    '/yt/blank': PAGE('YT blank'),
    '/yt/popup': PAGE('YT popup'),
    '/x/': PAGE('X home'),
    // The stub's television interface: it reports what the pane told it the pane is.
    '/tv/':
      '<!doctype html><title>YT tv</title><h1 id="ua"></h1>' +
      '<script>document.getElementById("ua").textContent = navigator.userAgent</script>',
    '/away': PAGE('Away'),
  }
  const page = pages[url]
  if (page !== undefined) return [200, html, page]
  if (url === '/yt/bounce') return [302, { location: `http://localhost:${port}/away` }, '']
  if (url === '/yt/file.bin') return [200, { 'content-type': 'application/octet-stream' }, 'data']
  return [404, {}, '']
}

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const url = req.url ?? ''
    requests.push(url)
    const [status, headers, body] = route(url)
    res.writeHead(status, headers).end(body)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  port = (server.address() as AddressInfo).port
})

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

const yt = () => `http://127.0.0.1:${port}/yt/`

/** One pane of `widget`, beside a clock so there is something to tab and focus. */
function layoutWith(widget: string, state?: Record<string, unknown>) {
  return {
    version: 1,
    root: {
      kind: 'split',
      id: 'root',
      direction: 'row',
      sizes: [0.3, 0.7],
      children: [
        { kind: 'pane', id: 'clock', widget: 'clock' },
        { kind: 'pane', id: 'web', widget, ...(state ? { state } : {}) },
      ],
    },
  }
}

async function start(options: LaunchOptions = {}): Promise<Launched> {
  return launch(undefined, {
    layout: layoutWith('web.youtube'),
    ...options,
    env: {
      ELECDEX_WEB_HOMES: `youtube=${yt()},youtubetv=http://127.0.0.1:${port}/tv/,x=http://127.0.0.1:${port}/x/`,
      ...options.env,
    },
  })
}

interface ViewInfo {
  url: string
  title: string
  visible: boolean
  bounds: { x: number; y: number; width: number; height: number }
  id: number
}

/** The web views in the app's windows, as main has them. */
function views(app: Launched): Promise<ViewInfo[]> {
  return app.app.evaluate(({ BrowserWindow, WebContentsView }) =>
    BrowserWindow.getAllWindows()
      .flatMap((win) => win.contentView.children)
      .filter((view): view is InstanceType<typeof WebContentsView> => 'webContents' in view)
      .map((view) => ({
        url: view.webContents.getURL(),
        title: view.webContents.getTitle(),
        visible: view.getVisible(),
        bounds: view.getBounds(),
        id: view.webContents.id,
      })),
  )
}

/** Runs script in the first web view's page, as if the user did it. */
function inPage<T>(app: Launched, script: string): Promise<T> {
  return app.app.evaluate(({ BrowserWindow }, script) => {
    const view = BrowserWindow.getAllWindows()[0]?.contentView.children[0]
    if (view === undefined || !('webContents' in view)) throw new Error('no web view')
    return (view as Electron.WebContentsView).webContents.executeJavaScript(script, true)
  }, script) as Promise<T>
}

const webPane = (page: Page) => page.locator('[data-testid=pane][data-pane-id=web]')

async function box(locator: Locator) {
  const found = await locator.boundingBox()
  if (found === null) throw new Error('not visible')
  return found
}

async function expectShownOverBody(app: Launched): Promise<void> {
  const body = await box(webPane(app.page).getByTestId('web-page'))
  await expect
    .poll(async () => (await views(app))[0])
    .toMatchObject({
      visible: true,
      bounds: {
        x: Math.round(body.x),
        y: Math.round(body.y),
        width: Math.round(body.width),
        height: Math.round(body.height),
      },
    })
}

/**
 * How far apart the lightest and darkest pixels of the page are, from a picture of the
 * view: 0 means nothing can be made out (black on black).
 */
function pageContrast(app: Launched): Promise<number> {
  return app.app.evaluate(async ({ BrowserWindow }) => {
    const view = BrowserWindow.getAllWindows()[0]?.contentView.children[0]
    const image = await (view as Electron.WebContentsView).webContents.capturePage()
    const pixels = image.toBitmap()
    let darkest = 255
    let lightest = 0
    for (let i = 0; i < pixels.length; i += 4) {
      const luma = Math.round(
        0.2126 * (pixels[i + 2] ?? 0) + 0.7152 * (pixels[i + 1] ?? 0) + 0.0722 * (pixels[i] ?? 0),
      )
      if (luma < darkest) darkest = luma
      if (luma > lightest) lightest = luma
    }
    return lightest - darkest
  })
}

async function stubExternal(app: Launched): Promise<void> {
  await app.app.evaluate(({ shell }) => {
    const opened: string[] = []
    ;(globalThis as { __opened?: string[] }).__opened = opened
    shell.openExternal = async (url: string) => {
      opened.push(url)
    }
  })
}

const opened = (app: Launched) =>
  app.app.evaluate(() => (globalThis as { __opened?: string[] }).__opened ?? [])

test.describe('web panes', () => {
  test('are offered in the picker, one per preset, and open where the preset starts', async () => {
    const app = await launch(undefined, {
      env: {
        ELECDEX_WEB_HOMES: `youtube=${yt()},youtubetv=http://127.0.0.1:${port}/tv/,x=http://127.0.0.1:${port}/x/`,
      },
    })
    const { page } = app
    try {
      expect(await views(app)).toEqual([])
      await page.keyboard.press('Control+Shift+A')
      const picker = page.getByTestId('pane-picker')
      for (const widget of ['web.browser', 'web.youtube', 'web.youtubetv', 'web.x']) {
        await expect(
          picker.locator(`[data-testid=pane-picker-item][data-widget="${widget}"]`),
        ).toHaveCount(1)
      }
      await picker.locator('[data-testid=pane-picker-item][data-widget="web.x"]').click()
      const pane = page.locator('[data-testid=pane][data-widget="web.x"]')
      await expect(pane.getByTestId('pane-subtitle')).toHaveText('X home')
      await expect(pane.getByTestId('web-where')).toHaveText(`127.0.0.1:${port}/x/`)
      await expect.poll(async () => (await views(app)).map((v) => v.visible)).toEqual([true])
    } finally {
      await app.close()
    }
  })

  test('sit over their pane, step aside for a dialog and a hidden tab, and come back', async () => {
    const app = await start()
    const { page } = app
    try {
      await expect(webPane(page).getByTestId('pane-subtitle')).toHaveText('YT home')
      await expectShownOverBody(app)

      // A dialog: the view goes, and a picture of it stands in its place.
      await page.keyboard.press('Control+Shift+Period')
      await expect(page.getByTestId('settings-dialog')).toBeVisible()
      await expect.poll(async () => (await views(app))[0]?.visible).toBe(false)
      await expect(webPane(page).getByTestId('web-snapshot')).toBeVisible()
      await page.keyboard.press('Escape')
      await expectShownOverBody(app)
      await expect(webPane(page).getByTestId('web-snapshot')).toHaveCount(0)

      // The window resizes: the view follows.
      await app.app.evaluate(({ BrowserWindow }) => {
        const win = BrowserWindow.getAllWindows()[0]
        const [w, h] = win?.getSize() ?? [800, 600]
        win?.setSize((w ?? 800) - 120, (h ?? 600) - 80)
      })
      await expectShownOverBody(app)

      // Another pane as a tab in front: hidden; back in front: shown again, same page.
      const before = (await views(app))[0]?.id
      await page
        .locator('[data-testid=pane][data-pane-id=web]')
        .click({ position: { x: 20, y: 5 } })
      await page.keyboard.press('Control+Shift+T')
      await expect(page.getByTestId('tabs-host')).toHaveCount(1)
      await expect.poll(async () => (await views(app))[0]?.visible).toBe(false)
      // A hidden view's page is not told it is hidden (Electron 44): it keeps running, which
      // is what lets a video in a background tab go on playing. If this ever changes, the
      // sound stops with it - hence the check.
      expect(await inPage<string>(app, 'document.visibilityState')).toBe('visible')
      await page.getByTestId('tabs-host').getByTestId('tab').first().click()
      await expectShownOverBody(app)
      expect((await views(app))[0]?.id).toBe(before)
    } finally {
      await app.close()
    }
  })

  test('keep their page when their pane is moved', async () => {
    // The web pane waits behind a clock in a tab group, so no view is on screen while
    // the group is dragged: hiding a view mid-drag makes Chromium synthesise a mouse
    // move without the buttons Playwright pressed, which ends the drag (a real mouse
    // keeps its buttons). Hiding for a drag is covered in tests/component/web-widget.
    const app = await start({
      layout: {
        version: 1,
        root: {
          kind: 'split',
          id: 'root',
          direction: 'row',
          sizes: [0.5, 0.5],
          children: [
            {
              kind: 'tabs',
              id: 'group',
              activeIndex: 1,
              children: [
                { kind: 'pane', id: 'web', widget: 'web.youtube' },
                { kind: 'pane', id: 'clock', widget: 'clock' },
              ],
            },
            { kind: 'pane', id: 'calendar', widget: 'calendar' },
          ],
        },
      },
    })
    const { page } = app
    try {
      await expect.poll(async () => (await views(app))[0]?.title).toBe('YT home')
      // The clock in front (focus may have brought the web tab forward at start).
      await page.getByTestId('tabs-host').getByTestId('tab').nth(1).click()
      await expect.poll(async () => (await views(app))[0]?.visible).toBe(false)
      const before = (await views(app))[0]?.id

      // The group, by its header, to the right of the calendar.
      const header = await box(page.getByTestId('tabs-host').locator('header'))
      const calendar = await box(page.locator('[data-testid=pane][data-widget=calendar]'))
      await page.mouse.move(header.x + header.width / 2, header.y + header.height / 2)
      await page.mouse.down()
      await page.mouse.move(calendar.x + calendar.width - 12, calendar.y + calendar.height / 2, {
        steps: 12,
      })
      await expect(page.getByTestId('pane-drag')).toHaveCount(1)
      await page.mouse.up()
      await expect
        .poll(async () => {
          const group = await box(page.getByTestId('tabs-host'))
          const after = await box(page.locator('[data-testid=pane][data-widget=calendar]'))
          return group.x > after.x
        })
        .toBe(true)

      // Brought to the front where it went: the same page, over its new place.
      await page.getByTestId('tabs-host').getByTestId('tab').first().click()
      await expectShownOverBody(app)
      expect((await views(app)).map((v) => v.id)).toEqual([before])
      expect(await inPage<string>(app, 'document.title')).toBe('YT home')
    } finally {
      await app.close()
    }
  })

  test('cover the window while a page is fullscreen, and go back to their pane after', async () => {
    const app = await start()
    try {
      await expect(webPane(app.page).getByTestId('pane-subtitle')).toHaveText('YT home')
      await expectShownOverBody(app)
      const content = () =>
        app.app.evaluate(({ BrowserWindow }) => {
          const [width, height] = BrowserWindow.getAllWindows()[0]?.getContentSize() ?? []
          return { x: 0, y: 0, width, height }
        })
      await inPage(app, 'document.body.requestFullscreen().then(() => 1)')
      await expect.poll(async () => (await views(app))[0]?.bounds).toEqual(await content())
      await inPage(app, 'document.exitFullscreen().then(() => 1)')
      await expectShownOverBody(app)
      // The app was windowed before, and is again.
      await expect
        .poll(() =>
          app.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.isFullScreen()),
        )
        .toBe(false)
    } finally {
      await app.close()
    }
  })

  test('ask a site for its television interface in the TV pane, and not in the others', async () => {
    const app = await start({ layout: layoutWith('web.youtubetv') })
    try {
      await expect(webPane(app.page).getByTestId('pane-subtitle')).toHaveText('YT tv')
      // Google refuses to sign in from an embedded browser, so the television interface is
      // how a YouTube pane is signed in at all: with a code entered on a phone.
      const agent = await inPage<string>(app, 'document.getElementById("ua").textContent')
      expect(agent).toMatch(/TV Safari/)
      expect(agent).not.toMatch(/Electron|elecdex/)
    } finally {
      await app.close()
    }

    const ordinary = await start()
    try {
      await expect(webPane(ordinary.page).getByTestId('pane-subtitle')).toHaveText('YT home')
      const agent = await inPage<string>(ordinary, 'navigator.userAgent')
      expect(agent).toMatch(/Chrome[/]/)
      expect(agent).not.toMatch(/TV Safari/)
    } finally {
      await ordinary.close()
    }
  })

  test('keep their page through a reload of the workspace and a restart', async () => {
    let app = await start()
    try {
      await expect(webPane(app.page).getByTestId('pane-subtitle')).toHaveText('YT home')
      await inPage(app, 'window.__mark = 42; document.querySelector("#next").click()')
      await expect(webPane(app.page).getByTestId('pane-subtitle')).toHaveText('YT next')
      await inPage(app, 'window.__mark = 42')

      await app.page.reload()
      await expect(app.page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
      await expectShownOverBody(app)
      // The same document: the page did not load again.
      expect(await inPage<number>(app, 'window.__mark')).toBe(42)
      expect((await views(app)).length).toBe(1)
      await expect(webPane(app.page).getByTestId('pane-subtitle')).toHaveText('YT next')

      app = await app.relaunch()
      await expect(webPane(app.page).getByTestId('pane-subtitle')).toHaveText('YT next')
      expect((await views(app))[0]?.url).toBe(`http://127.0.0.1:${port}/yt/next`)
    } finally {
      await app.close()
    }
  })

  test('destroy the page when the pane closes', async () => {
    const app = await start()
    try {
      await expect.poll(async () => (await views(app)).length).toBe(1)
      await webPane(app.page).hover()
      await webPane(app.page).getByTestId('pane-close').click()
      await expect(webPane(app.page)).toHaveCount(0)
      await expect.poll(async () => (await views(app)).length).toBe(0)
      await expect
        .poll(() =>
          app.app.evaluate(
            ({ webContents }) =>
              webContents.getAllWebContents().filter((c) => c.getURL().includes('/yt/')).length,
          ),
        )
        .toBe(0)
    } finally {
      await app.close()
    }
  })

  test('keep a preset to its site: other hosts and schemes go to the browser or nowhere', async () => {
    const app = await start()
    try {
      await expect(webPane(app.page).getByTestId('pane-subtitle')).toHaveText('YT home')
      await stubExternal(app)

      await inPage(app, 'document.querySelector("#away").click()')
      await expect.poll(() => opened(app)).toEqual([`http://localhost:${port}/away`])

      // A redirect off the site is caught too.
      await inPage(app, `location.href = "http://127.0.0.1:${port}/yt/bounce"`)
      await expect.poll(() => opened(app)).toHaveLength(2)

      // A file: link, a download: nothing happens.
      await inPage(app, 'document.querySelector("#file").click()')
      await inPage(app, 'document.querySelector("#saved").click()')
      // target=_blank on the site opens in the pane itself; no window is made.
      await inPage(app, 'document.querySelector("#blank").click()')
      await expect(webPane(app.page).getByTestId('pane-subtitle')).toHaveText('YT blank')
      expect(
        await app.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length),
      ).toBe(1)
      expect(requests).not.toContain('/away')
      expect((await opened(app)).every((url) => url.startsWith('http://localhost'))).toBe(true)
      expect((await views(app))[0]?.url).toBe(`http://127.0.0.1:${port}/yt/blank`)
    } finally {
      await app.close()
    }
  })

  test('open a sign-in popup on the site as a window without the app bridge', async () => {
    const app = await start()
    try {
      await expect(webPane(app.page).getByTestId('pane-subtitle')).toHaveText('YT home')
      await inPage(app, 'window.open("/yt/popup", "signin", "width=320,height=320"); 1')
      await expect
        .poll(() =>
          app.app.evaluate(({ BrowserWindow }) =>
            BrowserWindow.getAllWindows().some((w) => w.webContents.getURL().includes('/yt/popup')),
          ),
        )
        .toBe(true)
      const popup = await app.app.evaluate(async ({ BrowserWindow }) => {
        const win = BrowserWindow.getAllWindows().find((w) =>
          w.webContents.getURL().includes('popup'),
        )
        if (!win) return null
        const bridge = await win.webContents.executeJavaScript('typeof window.elecdex')
        return { bridge, partition: win.webContents.session.storagePath }
      })
      expect(popup?.bridge).toBe('undefined')
      // The popup shares the web panes' session (a sign-in there counts in the pane),
      // which is not the workspace's.
      const sessions = await app.app.evaluate(({ BrowserWindow }) => {
        const win = BrowserWindow.getAllWindows().find((w) =>
          w.webContents.getURL().includes('index.html'),
        )
        const view = win?.contentView.children[0] as Electron.WebContentsView | undefined
        const result = {
          view: view?.webContents.session.storagePath,
          workspace: win?.webContents.session.storagePath,
        }
        for (const other of BrowserWindow.getAllWindows()) if (other !== win) other.close()
        return result
      })
      expect(sessions.view).toBeTruthy()
      expect(popup?.partition).toBe(sessions.view)
      expect(sessions.view).not.toBe(sessions.workspace)
      await expect
        .poll(() => app.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length))
        .toBe(1)
    } finally {
      await app.close()
    }
  })

  test('give pages no permissions and no app bridge', async () => {
    const app = await start()
    try {
      await expect(webPane(app.page).getByTestId('pane-subtitle')).toHaveText('YT home')
      expect(await inPage(app, 'typeof window.elecdex')).toBe('undefined')
      expect(await inPage(app, 'typeof require')).toBe('undefined')
      const permissions = await inPage<string[]>(
        app,
        `Promise.all(['geolocation', 'notifications', 'camera', 'microphone'].map((name) =>
          navigator.permissions.query({ name }).then((s) => s.state, () => 'unsupported')))`,
      )
      expect(permissions.every((state) => state === 'denied' || state === 'unsupported')).toBe(true)
      const media = await inPage<string>(
        app,
        'navigator.mediaDevices.getUserMedia({ audio: true }).then(() => "granted", (e) => e.name)',
      )
      expect(media).not.toBe('granted')
      const ua = await inPage<string>(app, 'navigator.userAgent')
      expect(ua).not.toMatch(/Electron|elecdex/)
    } finally {
      await app.close()
    }
  })

  test('draw pages in their own colours, and in the theme when asked', async () => {
    const app = await start()
    const { page } = app
    const filter = () => inPage<string>(app, 'getComputedStyle(document.documentElement).filter')
    // What pages are told. Playwright emulates a light scheme in every page it drives,
    // so the page's own media query cannot show it here.
    const scheme = () => app.app.evaluate(({ nativeTheme }) => nativeTheme.themeSource === 'dark')
    const picture = () => webPane(page).getByTestId('web-snapshot').getAttribute('src')
    try {
      await expect(webPane(page).getByTestId('pane-subtitle')).toHaveText('YT home')
      // Sites keep their own colours until asked otherwise.
      await expect.poll(filter).toBe('none')
      await expect.poll(scheme).toBe(true)

      // Settings: tint on. The page is behind the dialog, so the pane shows a picture of
      // it - which is taken again in the new colours rather than waiting for the dialog.
      await page.keyboard.press('Control+Shift+Period')
      const tint = page.getByTestId('settings-web-tint')
      await expect(tint).not.toBeChecked()
      const before = await picture()
      await tint.check()
      await expect.poll(filter).toMatch(/^url\("data:image\/svg\+xml/)
      await expect.poll(picture).not.toBe(before)
      await page.keyboard.press('Escape')
      await expect.poll(filter).toMatch(/^url\(/)

      // A new document gets the tint again.
      await inPage(app, 'document.querySelector("#next").click()')
      await expect(webPane(page).getByTestId('pane-subtitle')).toHaveText('YT next')
      await expect.poll(filter).toMatch(/^url\(/)

      // Each pane has its own switch, on the right of the address, which wins over the setting.
      const toggle = webPane(page).getByTestId('web-tint')
      const bar = await box(webPane(page).getByTestId('web-where'))
      expect((await box(toggle)).x).toBeGreaterThan(bar.x)
      await expect(toggle).toHaveAttribute('aria-pressed', 'true')
      await toggle.click()
      await expect.poll(filter).toBe('none')
      await expect(toggle).toHaveAttribute('aria-pressed', 'false')
      await page.keyboard.press('Control+Shift+Period')
      await page.getByTestId('settings-web-tint').uncheck()
      await page.getByTestId('settings-web-tint').check()
      await page.keyboard.press('Escape')
      // Still its own answer, whatever the setting did.
      await expect.poll(filter).toBe('none')
      await toggle.click()
      await expect.poll(filter).toMatch(/^url\(/)

      // The Business themes never tint, and the light one asks for light pages.
      await page.evaluate(() => window.elecdex.settings.patch({ theme: 'business-light' }))
      await expect.poll(filter).toBe('none')
      await expect.poll(scheme).toBe(false)
      await page.evaluate(() => window.elecdex.settings.patch({ theme: 'amber' }))
      await expect.poll(filter).toMatch(/^url\(/)
      await expect.poll(scheme).toBe(true)
    } finally {
      await app.close()
    }
  })

  test("keep a page readable on the theme's ground, whatever colours it brings", async () => {
    const app = await start({ layout: layoutWith('web.youtube', { url: `${yt()}bare` }) })
    const { page } = app
    const filter = () => inPage<string>(app, 'getComputedStyle(document.documentElement).filter')
    try {
      await expect(webPane(page).getByTestId('pane-subtitle')).toHaveText('YT bare')
      await expectShownOverBody(app)
      // The view sits on the theme's near-black ground; the page brings no colours of its
      // own, so it is told to follow the theme's scheme and is light on dark.
      expect(
        await inPage<string>(app, 'getComputedStyle(document.documentElement).colorScheme'),
      ).toBe('dark')
      await expect.poll(() => pageContrast(app)).toBeGreaterThan(40)

      // Tinted as well: still readable.
      await webPane(page).getByTestId('web-tint').click()
      await expect.poll(filter).toMatch(/^url\(/)
      await expect.poll(() => pageContrast(app)).toBeGreaterThan(40)

      // A light theme: the page's defaults go light with it, on a light ground.
      await page.evaluate(() => window.elecdex.settings.patch({ theme: 'business-light' }))
      await expect
        .poll(() => inPage<string>(app, 'getComputedStyle(document.documentElement).colorScheme'))
        .toBe('light')
      await expect.poll(() => pageContrast(app)).toBeGreaterThan(40)
    } finally {
      await app.close()
    }
  })

  test('give app shortcuts back from the page, and focus their pane when the page is used', async () => {
    const app = await start()
    const { page } = app
    try {
      await expect(webPane(page).getByTestId('pane-subtitle')).toHaveText('YT home')
      await page.locator('[data-testid=pane][data-widget=clock]').click()
      await expect(page.locator('[data-testid=pane][data-widget=clock]')).toHaveClass(/focused/)

      await inPage(app, 'document.querySelector("#field").focus(); 1')
      // A press in the page focuses its pane.
      await app.app.evaluate(({ BrowserWindow }) => {
        const view = BrowserWindow.getAllWindows()[0]?.contentView.children[0]
        const contents = (view as Electron.WebContentsView).webContents
        contents.focus()
        for (const type of ['mouseDown', 'mouseUp'] as const) {
          contents.sendInputEvent({ type, x: 5, y: 5, button: 'left', clickCount: 1 })
        }
      })
      await expect(webPane(page)).toHaveClass(/focused/)
      await inPage(app, 'document.querySelector("#field").focus(); 1')

      // Plain typing stays in the page.
      const press = (keyCode: string, modifiers: string[] = []) =>
        app.app.evaluate(
          ({ BrowserWindow }, { keyCode, modifiers }) => {
            const view = BrowserWindow.getAllWindows()[0]?.contentView.children[0]
            const contents = (view as Electron.WebContentsView).webContents
            for (const type of ['keyDown', 'char', 'keyUp'] as const) {
              contents.sendInputEvent({ type, keyCode, modifiers: modifiers as ['control'] })
            }
          },
          { keyCode, modifiers },
        )
      await press('a')
      await expect
        .poll(() => inPage<string>(app, 'document.querySelector("#field").value'))
        .toBe('a')

      // Ctrl+Shift+A is the app's: the picker opens, and the page's field gets nothing.
      await press('A', ['control', 'shift'])
      await expect(page.getByTestId('pane-picker')).toBeVisible()
      await expect.poll(async () => (await views(app))[0]?.visible).toBe(false)
      expect(await inPage<string>(app, 'document.querySelector("#field").value')).toBe('a')
      await page.keyboard.press('Escape')
      await expectShownOverBody(app)

      // A shortcut that moves focus off the web pane takes the keyboard back to the
      // workspace: Ctrl+Shift+S adds a shell and puts the keyboard in it.
      await app.app.evaluate(({ BrowserWindow }) => {
        const view = BrowserWindow.getAllWindows()[0]?.contentView.children[0]
        ;(view as Electron.WebContentsView).webContents.focus()
      })
      await press('S', ['control', 'shift'])
      await expect(page.locator('[data-testid=pane][data-widget=terminal]')).toHaveClass(/focused/)
      await expect
        .poll(() =>
          app.app.evaluate(({ BrowserWindow }) => {
            const win = BrowserWindow.getAllWindows()[0]
            const view = win?.contentView.children[0] as Electron.WebContentsView
            return [win?.webContents.isFocused(), view.webContents.isFocused()]
          }),
        )
        .toEqual([true, false])
    } finally {
      await app.close()
    }
  })

  test('the browser opens typed addresses and refuses anything that is not a web page', async () => {
    const app = await launch(undefined, { layout: layoutWith('web.browser') })
    const { page } = app
    try {
      const pane = webPane(page)
      await expect(pane.getByTestId('web-empty')).toBeVisible()
      await expect.poll(async () => (await views(app)).map((v) => v.visible)).toEqual([false])

      const address = pane.getByTestId('web-address')
      await address.fill('file:///C:/Windows/win.ini')
      await address.press('Enter')
      await expect(pane.getByTestId('web-error')).toContainText('not a web address')
      expect((await views(app))[0]?.url).toBe('')

      await address.fill(`http://localhost:${port}/away`)
      await address.press('Enter')
      await expect(pane.getByTestId('pane-subtitle')).toHaveText('Away')
      await expect(pane.getByTestId('web-error')).toHaveCount(0)
      await expectShownOverBody(app)
      await expect(address).toHaveValue(`http://localhost:${port}/away`)

      await address.fill(`http://127.0.0.1:${port}/yt/next`)
      await address.press('Enter')
      await expect(pane.getByTestId('pane-subtitle')).toHaveText('YT next')
      await pane.getByTestId('web-back').click()
      await expect(pane.getByTestId('pane-subtitle')).toHaveText('Away')
      await pane.getByTestId('web-forward').click()
      await expect(pane.getByTestId('pane-subtitle')).toHaveText('YT next')

      // A host that does not answer: the pane says so.
      await address.fill('http://127.0.0.1:9/')
      await address.press('Enter')
      await expect(pane.getByTestId('web-error')).toBeVisible()
      await expect(pane.getByTestId('pane-badge')).toHaveText('error')
    } finally {
      await app.close()
    }
  })

  test('sign out of every site from the settings', async () => {
    const app = await start()
    const { page } = app
    try {
      await expect(webPane(page).getByTestId('pane-subtitle')).toHaveText('YT home')
      await inPage(app, 'document.cookie = "sid=1; max-age=3600"; localStorage.setItem("k", "v")')
      expect(await inPage<string>(app, 'document.cookie')).toBe('sid=1')

      await page.keyboard.press('Control+Shift+Period')
      const clear = page.getByTestId('settings-web-clear')
      await clear.click()
      await clear.click()
      await expect(page.getByTestId('settings-web-cleared')).toBeVisible()
      await page.keyboard.press('Escape')
      await webPane(page).getByTestId('web-reload').click()
      await expect.poll(() => inPage<string>(app, 'document.cookie')).toBe('')
      expect(await inPage<string | null>(app, 'localStorage.getItem("k")')).toBeNull()
    } finally {
      await app.close()
    }
  })
})
