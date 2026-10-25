import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, type Page } from '@playwright/test'
import { pluginFiles, turnOnPlugin } from '../support/plugins.js'
import { test } from '../support/shared.js'
import {
  launch,
  openSettings,
  pickerAnswers,
  quietFor,
  removeDir,
  single,
  waitForSaved,
} from '../support.js'

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

/** A layout of one plugin pane, of id p1. */
const onePane = (widget: string) => single(widget, { id: 'p1' })
const pluginPane = (page: Page, id = 'p1') =>
  page.locator(`[data-testid=pane][data-pane-id="${id}"] [data-testid=plugin-pane]`)

/** The tally plugin's count as the layout saved it. */
const savedTally = (text: string) =>
  (JSON.parse(text) as { root: { state?: { plugin?: { n?: number } } } }).root.state?.plugin?.n

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
  const app = await launch(undefined, { layout: onePane('plugin:pomodoro') })
  const { page } = app
  try {
    await expect(pluginPane(page)).toHaveAttribute('data-status', 'disabled')
    const offered = page.locator('[data-testid=pane-picker-item][data-widget="plugin:pomodoro"]')
    await page.keyboard.press('Control+Shift+KeyA')
    await expect(page.getByTestId('pane-picker-item').first()).toBeVisible()
    // Not offered while off.
    await expect(offered).toHaveCount(0)
    await page.keyboard.press('Escape')

    await turnOnPlugin(page, 'pomodoro')
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
    const stored = () => {
      const file = path.join(app.userData, 'plugin-data', 'pomodoro.json')
      return (JSON.parse(readFileSync(file, 'utf8')) as { timer?: { endsAt?: unknown } }).timer
        ?.endsAt
    }
    await expect.poll(() => typeof stored()).toBe('number')
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

test('a plugin installed from a folder is copied without what it does not import, and arrives off', async () => {
  // The folder a person picks: the plugin's module graph, beside a README and node_modules that
  // the copy leaves behind (main/plugins/install.ts).
  const source = mkdtempSync(path.join(tmpdir(), 'elecdex-plugin-source-'))
  mkdirSync(path.join(source, 'node_modules', 'left-out'), { recursive: true })
  writeFileSync(
    path.join(source, 'index.js'),
    `import { words } from './words.js'
export default {
  apiVersion: 1, id: 'from-folder', title: 'from folder',
  view(ctx) { ctx.render([{ t: 'text', text: words }]) },
}`,
  )
  writeFileSync(path.join(source, 'words.js'), "export const words = 'installed from a folder'")
  writeFileSync(path.join(source, 'README.md'), '# not copied')
  writeFileSync(path.join(source, 'node_modules', 'left-out', 'index.js'), 'export {}')
  const app = await launch(undefined, { layout: onePane('plugin:from-folder') })
  const { page } = app
  try {
    await pickerAnswers(app.app, source)
    await openSettings(page, 'plugins')
    await page.getByTestId('plugins-install').click()
    await expect(page.getByTestId('plugins-install-note')).toContainText('2 files')
    const copied = path.join(app.userData, 'plugins', path.basename(source))
    expect(readdirSync(copied).sort()).toEqual(['index.js', 'words.js'])
    // Off until agreed to, as one put in the folder by hand.
    const entry = page.locator('[data-testid=settings-plugin][data-plugin="from-folder"]')
    await expect(entry.getByTestId('plugin-enabled')).not.toBeChecked()
    await expect(pluginPane(page)).toHaveAttribute('data-status', 'disabled')
    await page.getByTestId('settings-close').click()
    await turnOnPlugin(page, 'from-folder')
    await expect(pluginPane(page)).toContainText('installed from a folder')
  } finally {
    await app.close()
    removeDir(source)
  }
})

test('a plugin reaches only its granted host, and every redirect is checked', async ({
  shared,
}) => {
  hits.length = 0
  const app = await shared({
    layout: onePane('plugin:net-probe'),
    files: pluginFiles({ 'net-probe.js': NET_PROBE }),
    env: { ELECDEX_PLUGIN_HOST_MAP: hostMap },
  })
  const { page } = app
  try {
    await turnOnPlugin(page, 'net-probe')
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
    // wait: no signal in the app (needs a hook): a tick in flight as the worker ends may still
    // land; nothing says when the plugin's worker has gone.
    await page.waitForTimeout(1500)
    await quietFor(3000, async () => hits.length, 'the requests to the stub')
  } finally {
    await app.close()
  }
})

test('a plugin that stops answering is stopped, and can be started again', async ({ shared }) => {
  const files = pluginFiles({
    'spinner.js': `export default {
      apiVersion: 1, id: 'spinner', title: 'spinner',
      view(ctx) {
        ctx.render([{ t: 'buttons', items: [{ action: 'spin', text: 'spin' }] }])
        ctx.on('action', () => { for (;;) {} })
      },
    }`,
  })
  const app = await shared({ layout: onePane('plugin:spinner'), files })
  const { page } = app
  try {
    await turnOnPlugin(page, 'spinner')
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
  }
})

test('editing a plugin reloads its panes, and a broken edit says why', async () => {
  const text = (label: string) =>
    `export default { apiVersion: 1, id: 'note', title: 'note', view(ctx) { ctx.render([{ t: 'text', text: '${label}' }]) } }`
  const app = await launch(undefined, {
    layout: onePane('plugin:note'),
    files: pluginFiles({ 'note.ts': text('first version') }),
  })
  const { page, userData: dir } = app
  try {
    await turnOnPlugin(page, 'note')
    await expect(pluginPane(page).getByText('first version')).toBeVisible()
    writeFileSync(path.join(dir, 'plugins', 'note.ts'), text('second version'))
    await expect(pluginPane(page).getByText('second version')).toBeVisible()
    writeFileSync(path.join(dir, 'plugins', 'note.ts'), 'export default {{{')
    await expect(pluginPane(page)).toHaveAttribute('data-status', 'error')
    writeFileSync(path.join(dir, 'plugins', 'note.ts'), text('fixed'))
    await expect(pluginPane(page).getByText('fixed')).toBeVisible()
  } finally {
    await app.close()
  }
})

/** A plugin that counts presses in its pane's state. */
const TALLY = pluginFiles({
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

test('a plugin pane gets the state it saved back after a restart', async () => {
  // Found as a pane that stayed empty after a restart: the saved state came back from the
  // layout as live state, which the message mounting the view could not carry.
  let app = await launch(undefined, { layout: onePane('plugin:tally'), files: TALLY })
  const dir = app.userData
  try {
    await turnOnPlugin(app.page, 'tally')
    await pluginPane(app.page).getByTestId('plugin-button').click()
    await pluginPane(app.page).getByTestId('plugin-button').click()
    await expect(pluginPane(app.page).getByText('tally 2')).toBeVisible()
    await waitForSaved(dir, (text) => savedTally(text) === 2)
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

test('a sign-in session is the plugin’s own, closes its window once it works, and lasts', async () => {
  const files = pluginFiles({
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
  const app = await launch(undefined, {
    layout: onePane('plugin:account'),
    files,
    env: { ELECDEX_PLUGIN_HOST_MAP: hostMap },
  })
  const dir = app.userData
  const { page } = app
  try {
    await turnOnPlugin(page, 'account')
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
  const app = await launch(undefined, {
    layout: onePane('plugin:device-probe'),
    files: pluginFiles({ 'device-probe.js': deviceProbe('v1') }),
  })
  const { page, userData: dir } = app
  const pane = pluginPane(page)
  const lines = pane.locator('p')
  try {
    // Turning it on says plainly what it asks for.
    await openSettings(page, 'plugins')
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
  }
})
