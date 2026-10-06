import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, type Page, test } from '@playwright/test'
import { launch, removeDir, settleLayout } from './support.js'

/**
 * Plugins in the running app (docs/plugins.md): the sample in a new plugins folder,
 * consent, the worker's lifetime, requests for plugins and the sign-in session.
 *
 * A plugin that fetches names api.example.test; ELECDEX_PLUGIN_HOST_MAP sends it to the
 * local stub below, so the grant checks run unchanged and nothing leaves the machine.
 */

let server: Server
let hostMap: string
const hits: string[] = []

/** What the stub answers, by path; anything else is a tick. */
const ROUTES: Record<string, (req: IncomingMessage, res: ServerResponse) => void> = {
  '/data': (_req, res) =>
    res.writeHead(200, { 'content-type': 'application/json' }).end('{"value":"from the stub"}'),
  '/redirect-out': (_req, res) =>
    res.writeHead(302, { location: 'https://evil.example.test/steal' }).end(),
  '/redirect-in': (_req, res) => res.writeHead(302, { location: '/data' }).end(),
  // The sign-in page: signing in is being given the cookie.
  '/': (_req, res) =>
    res
      // A lasting cookie, as real sites give: the sign-in survives a restart.
      .writeHead(200, {
        'content-type': 'text/html',
        'set-cookie': 'sid=signed-in; Path=/; Max-Age=86400',
      })
      .end('<title>stub sign-in</title><p>signed in</p>'),
  '/me': (req, res) => {
    const signedIn = (req.headers.cookie ?? '').includes('sid=signed-in')
    res.writeHead(signedIn ? 200 : 401).end(signedIn ? 'you' : 'nobody')
  },
}

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const url = req.url ?? ''
    hits.push(url)
    const route = ROUTES[url] ?? ((_req, response) => response.writeHead(200).end('tick'))
    route(req, res)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  hostMap = `api.example.test=127.0.0.1:${(server.address() as AddressInfo).port}`
})

test.afterAll(() => {
  server.close()
})

/** A userData folder with these plugins already in place (so no sample is written). */
function withPlugins(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-e2e-'))
  for (const [name, text] of Object.entries(files)) {
    const file = path.join(dir, 'plugins', name)
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, text)
  }
  writeFileSync(path.join(dir, 'settings.json'), JSON.stringify({ sound: { enabled: false } }))
  return dir
}

const single = (widget: string) => ({ version: 1, root: { kind: 'pane', id: 'p1', widget } })
const pluginPane = (page: Page, id = 'p1') =>
  page.locator(`[data-testid=pane][data-pane-id="${id}"] [data-testid=plugin-pane]`)

async function turnOn(page: Page, id: string): Promise<void> {
  await page.keyboard.press('Control+Shift+Period')
  await page.locator('[data-testid=settings-section][data-section=plugins]').click()
  const entry = page.locator(`[data-testid=settings-plugin][data-plugin="${id}"]`)
  await entry.getByTestId('plugin-enabled').click()
  const agree = entry.getByTestId('plugin-agree')
  if (await agree.isVisible()) await agree.click()
  await expect(entry).toHaveAttribute('data-status', 'ready')
  await page.getByTestId('settings-close').click()
}

const NET_PROBE = `export default {
  apiVersion: 1, id: 'net-probe', title: 'net probe',
  permissions: { hosts: ['api.example.test'] },
  service(ctx) {
    const results = []
    const attempt = async (label, url) => {
      try {
        const r = await ctx.fetch(url)
        results.push(label + ': ' + r.status + ' ' + r.text())
      } catch (e) {
        results.push(label + ': refused (' + e.message + ')')
      }
      ctx.publish(results.slice())
    }
    ;(async () => {
      await attempt('granted', 'https://api.example.test/data')
      await attempt('redirect in', 'https://api.example.test/redirect-in')
      await attempt('other host', 'https://other.example.test/data')
      await attempt('redirect out', 'https://api.example.test/redirect-out')
      await attempt('plain http', 'http://api.example.test/data')
    })()
    ctx.every(1000, () => ctx.fetch('https://api.example.test/tick').catch(() => {}))
  },
  view(ctx) {
    ctx.onData((lines) => ctx.render(lines.map((text) => ({ t: 'text', text }))))
  },
}`

test('a new plugins folder has the pomodoro sample, which runs only once agreed to', async () => {
  const app = await launch(undefined, { layout: single('plugin:pomodoro') })
  const { page } = app
  try {
    await expect(pluginPane(page)).toHaveAttribute('data-status', 'disabled')
    const offered = page.locator('[data-testid=pane-picker-item][data-widget="plugin:pomodoro"]')
    await page.keyboard.press('Control+Shift+KeyA')
    await expect(page.getByTestId('pane-picker-item').first()).toBeVisible()
    // Not offered while off.
    await expect(offered).toHaveCount(0)
    await page.keyboard.press('Escape')

    await turnOn(page, 'pomodoro')
    await expect(pluginPane(page)).toHaveAttribute('data-status', 'ready')
    await expect(pluginPane(page).getByText('25:00')).toBeVisible()
    await pluginPane(page).locator('[data-testid=plugin-button][data-action=start]').click()
    await expect(pluginPane(page).getByTestId('plugin-time')).toContainText(/24:5\d/)

    // A second pane from the picker shows the same timer: one service for the plugin.
    await page.keyboard.press('Control+Shift+KeyA')
    await offered.click()
    const panes = page.locator('[data-testid=pane][data-widget="plugin:pomodoro"]')
    await expect(panes).toHaveCount(2)
    await expect(panes.nth(1).getByTestId('plugin-time')).toContainText(/24:\d\d/)

    // The timer lives in the plugin's storage: it is still running after a restart.
    await page.waitForTimeout(1500)
    const again = await app.relaunch()
    await expect(pluginPane(again.page).getByTestId('plugin-time')).toContainText(/24:\d\d/)
    await expect(
      pluginPane(again.page).locator('[data-testid=plugin-button][data-action=pause]'),
    ).toBeVisible()
    await again.close()
  } catch (error) {
    await app.close()
    throw error
  }
})

test('a plugin reaches only its granted host, and every redirect is checked', async () => {
  const dir = withPlugins({ 'net-probe.js': NET_PROBE })
  hits.length = 0
  const app = await launch(dir, {
    layout: single('plugin:net-probe'),
    env: { ELECDEX_PLUGIN_HOST_MAP: hostMap },
  })
  const { page } = app
  try {
    await turnOn(page, 'net-probe')
    const pane = pluginPane(page)
    await expect(pane.getByText('granted: 200 {"value":"from the stub"}')).toBeVisible()
    await expect(pane.getByText('redirect in: 200 {"value":"from the stub"}')).toBeVisible()
    await expect(
      pane.getByText(/other host: refused \(other\.example\.test is not among/),
    ).toBeVisible()
    await expect(
      pane.getByText(/redirect out: refused \(evil\.example\.test is not among/),
    ).toBeVisible()
    await expect(pane.getByText(/plain http: refused \(only https/)).toBeVisible()
    expect(hits.filter((h) => h !== '/tick')).toEqual([
      '/data',
      '/redirect-in',
      '/data',
      '/redirect-out',
    ])

    // Closing the last pane ends the plugin, and with it the polling.
    await expect.poll(() => hits.filter((h) => h === '/tick').length).toBeGreaterThan(1)
    await page.locator('[data-testid=pane][data-pane-id=p1]').getByTestId('pane-close').click()
    await page.waitForTimeout(1500)
    const after = hits.length
    await page.waitForTimeout(3000)
    expect(hits.length).toBe(after)
  } finally {
    await app.close()
    removeDir(dir)
  }
})

test('a plugin that stops answering is stopped, and can be started again', async () => {
  const dir = withPlugins({
    'spinner.js': `export default {
      apiVersion: 1, id: 'spinner', title: 'spinner',
      view(ctx) {
        ctx.render([{ t: 'buttons', items: [{ action: 'spin', text: 'spin' }] }])
        ctx.on('action', () => { for (;;) {} })
      },
    }`,
  })
  const app = await launch(dir, { layout: single('plugin:spinner') })
  const { page } = app
  try {
    await turnOn(page, 'spinner')
    await pluginPane(page).locator('[data-testid=plugin-button][data-action=spin]').click()
    await expect(pluginPane(page).getByTestId('plugin-stopped')).toBeVisible({ timeout: 15_000 })
    // The rest of the app never froze.
    await expect(page.getByTestId('workspace')).toBeVisible()
    await pluginPane(page).getByTestId('plugin-restart').click()
    await expect(
      pluginPane(page).locator('[data-testid=plugin-button][data-action=spin]'),
    ).toBeVisible()
  } finally {
    await app.close()
    removeDir(dir)
  }
})

test('editing a plugin reloads its panes, and a broken edit says why', async () => {
  const text = (label: string) =>
    `export default { apiVersion: 1, id: 'note', title: 'note', view(ctx) { ctx.render([{ t: 'text', text: '${label}' }]) } }`
  const dir = withPlugins({ 'note.ts': text('first version') })
  const app = await launch(dir, { layout: single('plugin:note') })
  const { page } = app
  try {
    await turnOn(page, 'note')
    await expect(pluginPane(page).getByText('first version')).toBeVisible()
    writeFileSync(path.join(dir, 'plugins', 'note.ts'), text('second version'))
    await expect(pluginPane(page).getByText('second version')).toBeVisible()
    writeFileSync(path.join(dir, 'plugins', 'note.ts'), 'export default {{{')
    await expect(pluginPane(page)).toHaveAttribute('data-status', 'error')
    writeFileSync(path.join(dir, 'plugins', 'note.ts'), text('fixed'))
    await expect(pluginPane(page).getByText('fixed')).toBeVisible()
  } finally {
    await app.close()
    removeDir(dir)
  }
})

test('a plugin pane gets the state it saved back after a restart', async () => {
  // Found as a pane that stayed empty after a restart: the saved state came back from the
  // layout as live state, which the message mounting the view could not carry.
  const dir = withPlugins({
    'tally.js': `export default {
      apiVersion: 1, id: 'tally', title: 'tally',
      view(ctx) {
        let n = ctx.state.get()?.n ?? 0
        const draw = () => ctx.render([
          { t: 'text', text: 'tally ' + n },
          { t: 'buttons', items: [{ action: 'add', text: 'add' }] },
        ])
        ctx.on('action', (a) => {
          if (a.action !== 'add') return
          n += 1
          ctx.state.set({ n })
          draw()
        })
        draw()
      },
    }`,
  })
  let app = await launch(dir, { layout: single('plugin:tally') })
  try {
    await turnOn(app.page, 'tally')
    await pluginPane(app.page).getByTestId('plugin-button').click()
    await pluginPane(app.page).getByTestId('plugin-button').click()
    await expect(pluginPane(app.page).getByText('tally 2')).toBeVisible()
    // Past the layout's save debounce.
    await app.page.waitForTimeout(1500)
    app = await app.relaunch()
    const errors: string[] = []
    app.page.on('pageerror', (error) => errors.push(error.message))
    await expect(pluginPane(app.page)).toHaveAttribute('data-status', 'ready')
    await expect(pluginPane(app.page).getByText('tally 2')).toBeVisible()
    expect(errors).toEqual([])
  } finally {
    await app.close()
    removeDir(dir)
  }
})

test("a saved layout's plugin pane gets its own state, though the last layout's pane had its id", async () => {
  // Two layouts with a plugin pane of the same id ("save as" keeps ids): the pane stays
  // mounted over the switch and only its state changes, which the plugin must be given.
  const dir = withPlugins({
    'tally.js': `export default {
      apiVersion: 1, id: 'tally', title: 'tally',
      view(ctx) {
        let n = ctx.state.get()?.n ?? 0
        const draw = () => ctx.render([
          { t: 'text', text: 'tally ' + n },
          { t: 'buttons', items: [{ action: 'add', text: 'add' }] },
        ])
        ctx.on('action', (a) => {
          if (a.action !== 'add') return
          n += 1
          ctx.state.set({ n })
          draw()
        })
        draw()
      },
    }`,
  })
  const tally = (n: number) => ({
    version: 1,
    root: { kind: 'pane', id: 'p1', widget: 'plugin:tally', state: { plugin: { n } } },
  })
  writeFileSync(
    path.join(dir, 'layouts.json'),
    JSON.stringify({
      version: 1,
      items: [
        { id: 'layouta', name: 'one', tree: tally(2) },
        { id: 'layoutb', name: 'two', tree: tally(7) },
      ],
      active: 'layouta',
    }),
  )
  const app = await launch(dir, { layout: tally(2) })
  try {
    await turnOn(app.page, 'tally')
    await expect(pluginPane(app.page).getByText('tally 2')).toBeVisible()
    await app.page.keyboard.press('Control+Shift+Digit2')
    await settleLayout(app.page)
    await expect(pluginPane(app.page).getByText('tally 7')).toBeVisible()
    // Its own set is its own: counted on from there, not mounted again.
    await pluginPane(app.page).getByTestId('plugin-button').click()
    await expect(pluginPane(app.page).getByText('tally 8')).toBeVisible()
    await app.page.keyboard.press('Control+Shift+Digit1')
    await settleLayout(app.page)
    await expect(pluginPane(app.page).getByText('tally 2')).toBeVisible()
  } finally {
    await app.close()
    removeDir(dir)
  }
})

test('a sign-in session is the plugin’s own, closes its window once it works, and lasts', async () => {
  const dir = withPlugins({
    'account.js': `export default {
      apiVersion: 1, id: 'account', title: 'account',
      permissions: { hosts: ['api.example.test'], session: ['api.example.test'] },
      service(ctx) {
        const check = async () => {
          const r = await ctx.fetch('https://api.example.test/me')
          ctx.publish(r.status === 200 ? 'signed in' : 'signed out')
          if (r.status === 200) ctx.closeSignIn()
        }
        check()
        ctx.on('session', check)
      },
      view(ctx) {
        ctx.onData((state) => ctx.render(state === 'signed in'
          ? [{ t: 'text', text: state }]
          : [{ t: 'text', text: state }, { t: 'signin', host: 'api.example.test' }]))
      },
    }`,
  })
  const app = await launch(dir, {
    layout: single('plugin:account'),
    env: { ELECDEX_PLUGIN_HOST_MAP: hostMap },
  })
  const { page } = app
  try {
    await turnOn(page, 'account')
    await expect(pluginPane(page).getByText('signed out')).toBeVisible()
    // The button is as wide as its words, not stretched across the pane.
    const button = await pluginPane(page).getByTestId('plugin-signin').boundingBox()
    const paneBox = await pluginPane(page).boundingBox()
    expect(button?.width ?? 0).toBeLessThan((paneBox?.width ?? 0) / 2)
    await pluginPane(page).getByTestId('plugin-signin').click()
    await expect.poll(() => app.app.windows().length).toBe(2)
    const signIn = app.app.windows().find((w) => w !== page)
    // The window names the plugin and the site it is on, whatever the page calls itself.
    const titles = () =>
      app.app.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows().map((w) => w.getTitle()),
      )
    await expect
      .poll(titles)
      .toContainEqual(
        expect.stringMatching(/^sign in \(plugin account\) - http:\/\/127\.0\.0\.1:\d+$/),
      )
    // The workspace's own session never got the cookie.
    expect(await page.evaluate(() => document.cookie)).toBe('')
    // Signing in set the cookie: the plugin sees it and closes the window itself.
    expect(signIn).toBeDefined()
    await expect(pluginPane(page).getByText('signed in')).toBeVisible()
    await expect.poll(() => app.app.windows().length).toBe(1)

    // Still signed in after a restart, with nothing to click.
    const again = await app.relaunch()
    await expect(pluginPane(again.page).getByText('signed in')).toBeVisible()
    await again.close()
  } catch (error) {
    await app.close()
    throw error
  } finally {
    removeDir(dir)
  }
})

/** A plugin that shows what reaches it of canvas, keys and focus (apiVersion 2). */
const deviceProbe = (version: string) => `export default {
  apiVersion: 2, id: 'device-probe', title: 'device probe',
  permissions: { keys: true, sound: true },
  view(ctx) {
    const lines = []
    const show = () =>
      ctx.render([{ t: 'canvas', id: 'c', height: 80 }, ...lines.slice(-10).map((text) => ({ t: 'text', text }))])
    ctx.on('surface', (s) => {
      s.g.fillStyle = ctx.theme.colors.accent
      s.g.fillRect(0, 0, s.w, s.h)
      lines.push('${version} surface ' + (s.w > 0 && s.h === 80))
      show()
    })
    ctx.on('focus', () => { lines.push('focus ' + ctx.keys.focused); show() })
    ctx.on('key', (k) => {
      lines.push((k.down ? 'down ' : 'up ') + k.code + (k.shift ? ' shift' : '') + ' ' + (Math.abs(performance.now() - k.at) < 2000))
      show()
    })
    ctx.keys.play({ KeyA: { voice: 'piano', pitch: 60, level: 0 } })
    show()
  },
}`

test('a plugin draws on its canvas, and has the keys of its pane only while it is focused', async () => {
  const dir = withPlugins({ 'device-probe.js': deviceProbe('v1') })
  const app = await launch(dir, { layout: single('plugin:device-probe') })
  const { page } = app
  const pane = pluginPane(page)
  const lines = pane.locator('p')
  try {
    // Turning it on says plainly what it asks for.
    await page.keyboard.press('Control+Shift+Period')
    await page.locator('[data-testid=settings-section][data-section=plugins]').click()
    const entry = page.locator('[data-testid=settings-plugin][data-plugin="device-probe"]')
    await entry.getByTestId('plugin-enabled').click()
    await expect(entry.getByTestId('plugin-consent')).toContainText('receive the keys you press')
    await expect(entry.getByTestId('plugin-consent')).toContainText('play music and sounds')
    await entry.getByTestId('plugin-agree').click()
    await page.getByTestId('settings-close').click()

    await expect(pane.getByText('v1 surface true')).toBeVisible()
    await expect(pane.getByTestId('plugin-keys')).toHaveCount(0)
    await pane.getByTestId('plugin-canvas').click()
    await expect(pane.getByText('focus true')).toBeVisible()
    await expect(pane.getByTestId('plugin-keys')).toBeVisible()

    // Keys arrive down and up, on the worker's own clock; a bound one sounds in the host.
    await page.keyboard.press('a')
    await expect(pane.getByText('down KeyA true')).toBeVisible()
    await expect(pane.getByText('up KeyA true')).toBeVisible()
    await expect(pane).toHaveAttribute('data-notes', '1')
    // The piano is its physical strings once the audio thread has loaded them, which the
    // page's CSP must allow; until then the recipe plays it.
    await expect
      .poll(async () => {
        await page.keyboard.press('a')
        return Number(await pane.getAttribute('data-strings'))
      })
      .toBeGreaterThan(0)
    await page.keyboard.press('Shift+B')
    await expect(pane.getByText('down KeyB shift true')).toBeVisible()
    // A chord with Ctrl stays the app's, and Tab still moves the keyboard on.
    await page.keyboard.press('Control+KeyJ')
    await expect(pane.getByText(/KeyJ/)).toHaveCount(0)

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await expect(pane.getByText('focus false')).toBeVisible()
    await expect(pane.getByTestId('plugin-keys')).toHaveCount(0)
    await page.keyboard.press('e')
    await expect(pane.getByText(/KeyE/)).toHaveCount(0)
    expect(await lines.count()).toBeGreaterThan(0)

    // An edit starts a new worker: it is handed a canvas of its own to draw on.
    writeFileSync(path.join(dir, 'plugins', 'device-probe.js'), deviceProbe('v2'))
    await expect(pane.getByText('v2 surface true')).toBeVisible()
  } finally {
    await app.close()
    removeDir(dir)
  }
})
