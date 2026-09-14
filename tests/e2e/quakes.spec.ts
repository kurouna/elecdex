import { existsSync, readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * Earthquakes: the quakes pane, the alert banner, the globe's marks and the
 * settings, against a local stand-in for JMA's list.json.
 *
 * What matters beyond the display: nothing is fetched while alerts are off and
 * no quakes pane is open, an earthquake is announced once (not again after a
 * restart), and only recent ones at the chosen intensity are. No test here
 * reaches JMA.
 */

let server: Server
let origin: string
let list: unknown[] = []
let listRequests = 0

/** A list.json entry for an earthquake `minutesAgo` minutes before now. */
function entry(
  eid: string,
  minutesAgo: number,
  maxi: string,
  place: [string, string],
  mag = '5.1',
) {
  const at = new Date(Date.now() - minutesAgo * 60_000).toISOString()
  return {
    ctt: eid,
    eid,
    rdt: at,
    ttl: '震源・震度情報',
    ift: '発表',
    ser: '1',
    at,
    anm: place[0],
    en_anm: place[1],
    cod: '+38.3+142.4-40000/',
    mag,
    maxi,
  }
}

test.beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/bosai/quake/data/list.json') {
      listRequests += 1
      const body = JSON.stringify(list)
      const etag = `"${body.length}"`
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304).end()
        return
      }
      res.writeHead(200, { 'content-type': 'application/json', etag }).end(body)
      return
    }
    res.writeHead(404).end()
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
})

test.beforeEach(() => {
  listRequests = 0
  list = [
    entry('strong', 3, '5+', ['宮城県沖', 'Off the Coast of Miyagi Prefecture']),
    entry('weak', 2, '3', ['茨城県南部', 'Southern Ibaraki Prefecture'], '3.8'),
    entry('old', 180, '6-', ['石川県能登地方', 'Noto Region, Ishikawa Prefecture'], '6.0'),
  ]
})

const alertsOn = { sound: { enabled: false }, quakes: { notify: true, minIntensity: '5-' } }
const single = (widget: string) => ({ version: 1, root: { kind: 'pane', id: 'p', widget } })
const quakeActive = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const off = window.elecdex.quakes.observe((state) => {
          off()
          resolve(state.active)
        })
      }),
  )

test('with alerts off and no quakes pane, JMA’s list is never fetched', async () => {
  const { page, userData, close } = await launch(undefined, { jmaBaseUrl: `${origin}/bosai` })
  try {
    await expect(page.locator('[data-testid=pane][data-widget=globe]')).toHaveCount(1)
    await page.waitForTimeout(1500)
    expect(listRequests).toBe(0)
    expect(await quakeActive(page)).toBe(false)
    await expect(page.getByTestId('globe-quakes')).toHaveCount(0)
    expect(existsSync(path.join(userData, 'quake-alerts.json'))).toBe(false)
  } finally {
    await close()
  }
})

test('the quakes pane lists earthquakes by intensity, and closing it stops the fetching', async () => {
  const { page, close } = await launch(undefined, {
    layout: single('quakes'),
    jmaBaseUrl: `${origin}/bosai`,
    args: ['--lang=en-US'],
  })
  try {
    const rows = page.getByTestId('quake-row')
    await expect(rows).toHaveCount(3, { timeout: 20_000 })
    await expect(rows.nth(0)).toHaveAttribute('data-id', 'weak')
    await expect(rows.nth(0)).toHaveClass(/moderate/)
    await expect(rows.nth(0)).toContainText('Southern Ibaraki Prefecture')
    await expect(rows.nth(1)).toHaveClass(/severe/)
    await expect(rows.nth(1)).toContainText('M5.1 · 40 km')
    await expect(page.getByTestId('quakes-credit')).toContainText('出典：気象庁ホームページ')
    await expect(page.getByTestId('quakes-credit')).toContainText('not an Earthquake Early Warning')
    await expect(page.getByTestId('quakes-alerts')).toHaveText('alerts off')
    // Alerts are off: listing is not announcing.
    await expect(page.getByTestId('quake-alert')).toHaveCount(0)
    expect(await quakeActive(page)).toBe(true)

    // The alerts button opens the settings at the earthquake section.
    await page.getByTestId('quakes-alerts').click()
    await expect(page.getByTestId('settings-quakes-notify')).toBeVisible()
    await page.keyboard.press('Escape')

    const pane = page.locator('[data-testid=pane][data-widget=quakes]')
    await pane.hover()
    await pane.getByTestId('pane-close').click()
    await expect.poll(() => quakeActive(page)).toBe(false)
  } finally {
    await close()
  }
})

test('an alert announces a recent strong earthquake once, marks the globe, and not again after a restart', async () => {
  let launched = await launch(undefined, {
    settings: alertsOn,
    jmaBaseUrl: `${origin}/bosai`,
    args: ['--lang=ja'],
  })
  try {
    const { page } = launched
    const alerts = page.getByTestId('quake-alert')
    // Only the recent one at 5- or above: not the weak one, not the old strong one.
    await expect(alerts).toHaveCount(1, { timeout: 20_000 })
    await expect(alerts.first()).toHaveAttribute('data-id', 'strong')
    await expect(alerts.first()).toHaveClass(/severe/)
    await expect(page.getByTestId('quake-alert-text')).toHaveText(
      '宮城県沖 · 震度5強 · M5.1 · 深さ40km',
    )
    await expect(alerts.first()).toContainText('緊急地震速報ではありません')

    // The default layout's globe marks the day's earthquakes.
    await expect(page.getByTestId('globe-quakes')).toContainText('2')

    // A severe alert stays until dismissed.
    await page.waitForTimeout(1000)
    await expect(alerts).toHaveCount(1)
    // A reload does not lose it (the alert was sent before this page existed)...
    await page.reload()
    await expect(alerts).toHaveCount(1, { timeout: 20_000 })
    await page.getByTestId('quake-alert-dismiss').click()
    await expect(alerts).toHaveCount(0)
    // ...and a banner closed by hand does not come back with the next one.
    await page.reload()
    await expect(page.getByTestId('globe-quakes')).toContainText('2', { timeout: 20_000 })
    await page.waitForTimeout(1000)
    await expect(alerts).toHaveCount(0)
    await expect
      .poll(() => readFileSync(path.join(launched.userData, 'quake-alerts.json'), 'utf8'))
      .toContain('strong')

    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('globe-quakes')).toContainText('2', { timeout: 20_000 })
    await launched.page.waitForTimeout(1000)
    await expect(launched.page.getByTestId('quake-alert')).toHaveCount(0)
  } finally {
    await launched.close()
  }
})

test('turning alerts on in settings announces at the chosen intensity', async () => {
  const { page, userData, close } = await launch(undefined, {
    layout: single('clock'),
    jmaBaseUrl: `${origin}/bosai`,
    args: ['--lang=en-US'],
  })
  try {
    await page.keyboard.press('Control+Shift+Comma')
    await page.getByTestId('settings-section').locator('text=alerts').click()
    await expect(page.getByTestId('settings-quakes-intensity')).toBeDisabled()
    await expect(page.getByTestId('settings-quakes-intensity')).toHaveValue('5-')
    await page.getByTestId('settings-quakes-notify').check()
    await page.getByTestId('settings-quakes-intensity').selectOption('3')
    await expect
      .poll(() => JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8')).quakes)
      .toMatchObject({ notify: true, minIntensity: '3' })
    await page.keyboard.press('Escape')

    // Shindo 3 and up: both recent earthquakes, never the old one.
    const alerts = page.getByTestId('quake-alert')
    await expect(alerts).toHaveCount(2, { timeout: 20_000 })
    const ids = await alerts.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-id')).sort(),
    )
    expect(ids).toEqual(['strong', 'weak'])
    await expect(alerts.filter({ hasText: 'Shindo 3' })).toHaveClass(/moderate/)
    expect(listRequests).toBeGreaterThanOrEqual(1)

    // Turned off again, with no quakes pane: the list is no longer kept.
    await page.evaluate(() => window.elecdex.settings.patch({ quakes: { notify: false } }))
    await expect.poll(() => quakeActive(page)).toBe(false)
  } finally {
    await close()
  }
})

test('an alert reaches the system notifications when no window is in front', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: single('clock'),
    jmaBaseUrl: `${origin}/bosai`,
    args: ['--lang=en-US'],
  })
  try {
    // Recorded instead of shown; a hidden window is never the one in front.
    await app.evaluate(({ BrowserWindow, Notification }) => {
      const shown: string[] = []
      ;(globalThis as { __notified?: string[] }).__notified = shown
      Notification.prototype.show = function show(this: Electron.Notification) {
        shown.push(`${this.title}|${this.body}`)
      }
      BrowserWindow.getAllWindows()[0]?.hide()
    })
    await page.evaluate(() => window.elecdex.settings.patch({ quakes: { notify: true } }))
    await expect
      .poll(() => app.evaluate(() => (globalThis as { __notified?: string[] }).__notified), {
        timeout: 20_000,
      })
      .toHaveLength(1)
    const [notified] =
      (await app.evaluate(() => (globalThis as { __notified?: string[] }).__notified)) ?? []
    expect(notified).toContain('Earthquake')
    expect(notified).toContain(
      'Off the Coast of Miyagi Prefecture · Shindo 5+ · M5.1 · depth 40 km',
    )
    expect(notified).toContain('Source: JMA')

    // With the window in front, the banner is enough.
    await app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0]
      win?.show()
      win?.focus()
    })
    await expect(page.getByTestId('quake-alert')).toHaveCount(1)
  } finally {
    await close()
  }
})
