import { existsSync, readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import type { Quake, QuakeState } from '@shared/quakes'
import { clickThen, LEAVING, launch, SHOWING } from './support.js'

/**
 * Earthquakes and tsunamis: the quakes pane, the alert banners and tsunami card,
 * the globe's marks and the settings, against local stand-ins for JMA, the USGS
 * and NOAA.
 *
 * What matters beyond the display: nothing is fetched while alerts are off and no
 * quakes pane is open, only the chosen source is asked, an earthquake is announced
 * once (not again after a reload or restart), and a tsunami stays in sight while it
 * is in effect. No test here reaches the real services.
 */

let server: Server
let origin: string
/** What the stand-in serves, by path; reset before each test. */
let served: Record<string, string> = {}
let requests: string[] = []

/**
 * Marks every made-up place, area and headline, so a screenshot or a watched test run is
 * never taken for a real earthquake or tsunami.
 */
const TEST = '[TEST] '

const JMA_QUAKES = '/bosai/quake/data/list.json'
const JMA_TSUNAMI = '/bosai/tsunami/data/list.json'
const USGS_FEED = '/usgs/earthquakes/feed/v1.0/summary/4.5_day.geojson'
const NTWC_FEED = '/noaa/events/xml/PAAQAtom.xml'

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
    anm: `${TEST}${place[0]}`,
    en_anm: `${TEST}${place[1]}`,
    cod: '+38.3+142.4-40000/',
    mag,
    maxi,
  }
}

/** A JMA tsunami report with the given areas and category codes. */
const tsunamiReport = (areas: Array<[string, string, string?]>) =>
  JSON.stringify({
    Head: { Headline: { Text: `${TEST}津波警報を発表しました。\nただちに避難してください。` } },
    Body: {
      Tsunami: {
        Forecast: {
          Item: areas.map(([name, code, height]) => ({
            Area: { Name: `${TEST}${name}` },
            Category: { Kind: { Code: code } },
            FirstHeight: { Condition: 'ただちに津波来襲と予測' },
            ...(height ? { MaxHeight: { TsunamiHeight: height } } : {}),
          })),
        },
      },
    },
  })

const tsunamiListing = (json: string) =>
  JSON.stringify([{ eid: 'tsunami-event', json, rdt: new Date().toISOString(), ift: '発表' }])

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const url = req.url ?? ''
    requests.push(url)
    const body = served[url]
    if (body === undefined) {
      res.writeHead(404).end()
      return
    }
    const etag = `"${body.length}-${Buffer.from(body).toString('base64').slice(-12)}"`
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304).end()
      return
    }
    res.writeHead(200, { etag }).end(body)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
})

test.beforeEach(() => {
  requests = []
  served = {
    [JMA_QUAKES]: JSON.stringify([
      entry('strong', 3, '5+', ['宮城県沖', 'Off the Coast of Miyagi Prefecture']),
      entry('weak', 2, '3', ['茨城県南部', 'Southern Ibaraki Prefecture'], '3.8'),
      entry('old', 180, '6-', ['石川県能登地方', 'Noto Region, Ishikawa Prefecture'], '6.0'),
    ]),
    [JMA_TSUNAMI]: '[]',
  }
})

const services = () => ({
  jmaBaseUrl: `${origin}/bosai`,
  env: { ELECDEX_USGS_BASE_URL: `${origin}/usgs`, ELECDEX_NOAA_BASE_URL: `${origin}/noaa` },
})
/** Settings with JMA chosen, so the tests do not depend on the machine's time zone. */
const japan = (quakes: Record<string, unknown> = {}) => ({
  sound: { enabled: false },
  quakes: { source: 'jma', ...quakes },
})
const single = (widget: string) => ({ version: 1, root: { kind: 'pane', id: 'p', widget } })
const quakeState = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ active: boolean; source: string }>((resolve) => {
        const off = window.elecdex.quakes.observe((state) => {
          off()
          resolve({ active: state.active, source: state.source })
        })
      }),
  )
const quakeActive = async (page: Page) => (await quakeState(page)).active

test('with alerts off and no quakes pane, nothing is fetched from any source', async () => {
  const { page, userData, close } = await launch(undefined, { ...services() })
  try {
    await expect(page.locator('[data-testid=pane][data-widget=globe]')).toHaveCount(1)
    await page.waitForTimeout(1500)
    expect(requests).toEqual([])
    expect(await quakeActive(page)).toBe(false)
    await expect(page.getByTestId('globe-quakes')).toHaveCount(0)
    expect(existsSync(path.join(userData, 'quake-alerts.json'))).toBe(false)
  } finally {
    await close()
  }
})

test('the quakes pane lists Japan by intensity, asks only JMA, and closing it stops the fetching', async () => {
  const { page, close } = await launch(undefined, {
    layout: single('quakes'),
    settings: japan(),
    ...services(),
    args: ['--lang=en-US'],
  })
  try {
    const rows = page.getByTestId('quake-row')
    await expect(rows).toHaveCount(3, { timeout: 20_000 })
    await expect(rows.nth(0)).toHaveAttribute('data-id', 'weak')
    await expect(rows.nth(0)).toHaveClass(/moderate/)
    await expect(rows.nth(0)).toContainText('[TEST] Southern Ibaraki Prefecture')
    await expect(rows.nth(1)).toHaveClass(/severe/)
    await expect(rows.nth(1).locator('.badge')).toHaveText('5+')
    await expect(rows.nth(1)).toContainText('M5.1 · 40 km')
    await expect(page.getByTestId('quakes-credit')).toContainText('出典：気象庁ホームページ')
    await expect(page.getByTestId('quakes-credit')).toContainText('not an earthquake early warning')
    await expect(page.getByTestId('quakes-alerts')).toHaveText('alerts off')
    await expect(page.getByTestId('pane-subtitle')).toContainText('JMA · updated')
    // Alerts are off: listing is not announcing; and no tsunami is in effect.
    await expect(page.getByTestId('quake-alert')).toHaveCount(0)
    await expect(page.getByTestId('quakes-tsunami')).toHaveCount(0)
    expect(await quakeActive(page)).toBe(true)
    expect(requests.some((r) => r.startsWith('/usgs') || r.startsWith('/noaa'))).toBe(false)
    expect(requests).toContain(JMA_TSUNAMI)

    // The settings button, the same as every pane's, opens the settings at the earthquake section.
    await expect(page.getByTestId('quakes-settings-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await page.getByTestId('quakes-settings-toggle').click()
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

test('an alert announces a recent strong earthquake once, marks the globe, and not again after a reload or restart', async () => {
  let launched = await launch(undefined, {
    settings: japan({ notify: true }),
    ...services(),
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
      '[TEST] 宮城県沖 · 震度5強 · M5.1 · 深さ40km',
    )
    await expect(alerts.first()).toContainText('出典：気象庁 · 緊急地震速報ではありません')

    // The default layout's globe marks the day's earthquakes.
    await expect(page.getByTestId('globe-quakes')).toContainText('2')

    // A severe alert stays until dismissed.
    await page.waitForTimeout(1000)
    await expect(alerts).toHaveCount(1)
    // A reload does not lose it (the alert was sent before this page existed)...
    await page.reload()
    await expect(alerts).toHaveCount(1, { timeout: 20_000 })
    // Dismissed, it powers off before it goes.
    const alert = '[data-testid=quake-alert]'
    expect(await clickThen(page, '[data-testid=quake-alert-dismiss]', [alert])).toEqual({
      [alert]: LEAVING,
    })
    await expect(alerts).toHaveCount(0)
    // ...and a banner closed by hand does not come back.
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

test('turning alerts on in settings announces at the chosen intensity, or magnitude for the world', async () => {
  const { page, userData, close } = await launch(undefined, {
    layout: single('clock'),
    settings: japan(),
    ...services(),
    args: ['--lang=en-US'],
  })
  const saved = () => JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8')).quakes
  try {
    await page.keyboard.press('Control+Shift+Period')
    await page.getByTestId('settings-section').locator('text=alerts').click()
    await expect(page.getByTestId('settings-quakes-source')).toHaveValue('jma')
    await expect(page.getByTestId('settings-quakes-intensity')).toBeDisabled()
    await expect(page.getByTestId('settings-quakes-intensity')).toHaveValue('5-')
    await expect(page.getByTestId('settings-quakes-magnitude')).toHaveCount(0)
    await page.getByTestId('settings-quakes-notify').check()
    await page.getByTestId('settings-quakes-intensity').selectOption('3')
    await expect.poll(saved).toMatchObject({ notify: true, minIntensity: '3' })

    // Shindo 3 and up: both recent earthquakes, never the old one.
    const alerts = page.getByTestId('quake-alert')
    await expect(alerts).toHaveCount(2, { timeout: 20_000 })
    const ids = await alerts.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-id')).sort(),
    )
    expect(ids).toEqual(['strong', 'weak'])
    await expect(alerts.filter({ hasText: 'Shindo 3' })).toHaveClass(/moderate/)

    // The world: the intensity gives way to a magnitude, saved as a number.
    await page.getByTestId('settings-quakes-source').selectOption('usgs')
    await expect(page.getByTestId('settings-quakes-intensity')).toHaveCount(0)
    await expect(page.getByTestId('settings-quakes-magnitude')).toHaveValue('6')
    await page.getByTestId('settings-quakes-magnitude').selectOption('7')
    await expect.poll(saved).toMatchObject({ source: 'usgs', minMagnitude: 7 })
    await expect(page.getByTestId('settings-quakes-about')).toContainText('USGS')
    await expect.poll(async () => (await quakeState(page)).source).toBe('usgs')
    await page.keyboard.press('Escape')

    // Turned off again, with no quakes pane: nothing is kept current.
    await page.evaluate(() => window.elecdex.settings.patch({ quakes: { notify: false } }))
    await expect.poll(() => quakeActive(page)).toBe(false)
  } finally {
    await close()
  }
})

test('an alert reaches the system notifications when no window is in front', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: single('clock'),
    settings: japan(),
    ...services(),
    args: ['--lang=en-US'],
  })
  try {
    // Recorded instead of shown; a hidden window is never the one in front. Supported is
    // stubbed too: a Linux runner has no notification server, so Electron says it cannot.
    await app.evaluate(({ BrowserWindow, Notification }) => {
      const shown: string[] = []
      ;(globalThis as { __notified?: string[] }).__notified = shown
      Notification.isSupported = () => true
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
      '[TEST] Off the Coast of Miyagi Prefecture · Shindo 5+ · M5.1 · depth 40 km',
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

test('a JMA tsunami warning shows a card with its areas, folds into a tab, and says when it is lifted', async () => {
  served[JMA_TSUNAMI] = tsunamiListing('warning_VTSE41_0.json')
  served['/bosai/tsunami/data/warning_VTSE41_0.json'] = tsunamiReport([
    ['宮城県', '62', '1'],
    ['岩手県', '51', '3'],
    ['青森県太平洋沿岸', '71'],
  ])
  const { page, close } = await launch(undefined, {
    layout: single('clock'),
    settings: japan({ notify: true, minIntensity: '7' }),
    ...services(),
    args: ['--lang=ja'],
  })
  try {
    const card = page.getByTestId('tsunami-alert')
    await expect(card).toBeVisible({ timeout: 20_000 })
    await expect(card).toHaveAttribute('data-level', 'warning')
    await expect(card).toHaveClass(/severe/)
    await expect(page.getByTestId('tsunami-level')).toHaveText('津波警報')
    await expect(page.getByTestId('tsunami-summary')).toHaveText('[TEST] 岩手県 ほか 1 区域')
    await expect(card).toContainText('ただちに避難してください')
    // No earthquake reaches intensity 7: only the tsunami is announced.
    await expect(page.getByTestId('quake-alert')).toHaveCount(0)

    await page.getByTestId('tsunami-toggle').click()
    const areas = page.getByTestId('tsunami-areas').locator('li')
    await expect(areas).toHaveCount(2)
    await expect(areas.first()).toHaveText('津波警報 [TEST] 岩手県 ただちに津波来襲と予測 3 m')

    // Folded, it stays in sight as a tab; the tab opens it again. Each powers off as the other comes.
    const [cardSel, tabSel] = ['[data-testid=tsunami-alert]', '[data-testid=tsunami-tab]']
    expect(await clickThen(page, '[data-testid=tsunami-fold]', [cardSel, tabSel])).toEqual({
      [cardSel]: LEAVING,
      [tabSel]: SHOWING,
    })
    await expect(card).toHaveCount(0)
    await expect(page.getByTestId('tsunami-tab')).toHaveText('津波警報 · 発表中')
    expect(await clickThen(page, tabSel, [cardSel, tabSel])).toEqual({
      [cardSel]: SHOWING,
      [tabSel]: LEAVING,
    })
    await expect(card).toBeVisible()
    await expect(page.getByTestId('tsunami-tab')).toHaveCount(0)

    // Lifted: the card says so. (Alerts off and on make main check again at once.)
    served[JMA_TSUNAMI] = tsunamiListing('lifted_VTSE41_1.json')
    served['/bosai/tsunami/data/lifted_VTSE41_1.json'] = tsunamiReport([['岩手県', '50']])
    await page.evaluate(async () => {
      await window.elecdex.settings.patch({ quakes: { notify: false } })
      await window.elecdex.settings.patch({ quakes: { notify: true } })
    })
    await expect(card).toHaveAttribute('data-lifted', 'true', { timeout: 20_000 })
    await expect(card).toContainText('解除')
    const lifted = await clickThen(page, '[data-testid=tsunami-fold]', [cardSel, tabSel])
    expect(lifted).toEqual({
      [cardSel]: LEAVING,
      [tabSel]: { present: false, leaving: false, beamRunning: false },
    })
    await expect(card).toHaveCount(0)
    await expect(page.getByTestId('tsunami-tab')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('the banners left close up behind one that goes', async () => {
  served[JMA_QUAKES] = JSON.stringify([
    entry('first', 3, '5+', ['宮城県沖', 'Off the Coast of Miyagi Prefecture']),
    entry('second', 4, '5+', ['福島県沖', 'Off the Coast of Fukushima Prefecture']),
    entry('third', 5, '5+', ['茨城県沖', 'Off the Coast of Ibaraki Prefecture']),
  ])
  const { page, close } = await launch(undefined, {
    layout: single('clock'),
    settings: japan({ notify: true }),
    ...services(),
    args: ['--lang=ja'],
  })
  try {
    const alerts = page.getByTestId('quake-alert')
    await expect(alerts).toHaveCount(3, { timeout: 20_000 })
    await page.waitForTimeout(500)
    const ids = await alerts.evaluateAll((els) => els.map((el) => el.getAttribute('data-id')))
    const [, middle, last] = ids as [string, string, string]
    const top = (id: string) =>
      page
        .locator(`[data-testid=quake-alert][data-id=${id}]`)
        .evaluate((el) => el.getBoundingClientRect().top)
    const middleTop = await top(middle)
    const middleCentre = await page
      .locator(`[data-testid=quake-alert][data-id=${middle}]`)
      .evaluate((el) => {
        const box = el.getBoundingClientRect()
        return Math.round((box.top + box.bottom) / 2)
      })
    const lastTop = await top(last)

    const during = await page.evaluate(
      async ({ middle, last }) => {
        const card = (id: string) =>
          document.querySelector<HTMLElement>(`[data-testid=quake-alert][data-id=${id}]`)
        card(middle)?.querySelector<HTMLElement>('[data-testid=quake-alert-dismiss]')?.click()
        await new Promise((resolve) => requestAnimationFrame(resolve))
        await new Promise((resolve) => requestAnimationFrame(resolve))
        const box = card(middle)?.getBoundingClientRect()
        return {
          // Still where it was: it collapses about its own middle, not the top of the stack.
          middle: box ? Math.round((box.top + box.bottom) / 2) : null,
          leaving: card(middle)?.inert ?? false,
          // Taken out of the flow as it powers off, where it was.
          position: card(middle)?.style.position ?? '',
          moving: (card(last)?.getAnimations() ?? []).some((a) => a.playState === 'running'),
        }
      },
      { middle, last },
    )
    expect(during).toEqual({
      middle: middleCentre,
      leaving: true,
      position: 'absolute',
      moving: true,
    })
    await expect(alerts).toHaveCount(2)
    await expect.poll(() => top(last)).toBeCloseTo(middleTop, 0)
    expect(lastTop).toBeGreaterThan(middleTop)
  } finally {
    await close()
  }
})

test('a major tsunami warning powers on like every card, then breathes', async () => {
  served[JMA_TSUNAMI] = tsunamiListing('major_VTSE41_0.json')
  served['/bosai/tsunami/data/major_VTSE41_0.json'] = tsunamiReport([['宮城県', '52', '10']])
  const { page, close } = await launch(undefined, {
    layout: single('clock'),
    settings: japan({ notify: true, minIntensity: '7' }),
    ...services(),
    args: ['--lang=ja'],
  })
  try {
    const card = page.getByTestId('tsunami-alert')
    await expect(card).toHaveAttribute('data-level', 'major', { timeout: 20_000 })
    await expect(card).toHaveClass(/major/)
    // Both, in order: the breathing starts once the power-on has played.
    await expect(card).toHaveCSS('animation-name', /^crt-power-on, (svelte-[a-z0-9]+-)?breathe$/)
    await expect(card).toHaveCSS('animation-delay', '0s, 0.3s')

    // Folded and opened again at once: the same card plays its close back, and keeps no spent beam.
    await page.evaluate(async () => {
      document.querySelector<HTMLElement>('[data-testid=tsunami-fold]')?.click()
      await new Promise((resolve) => requestAnimationFrame(resolve))
      document.querySelector<HTMLElement>('[data-testid=tsunami-tab]')?.click()
    })
    await page.waitForTimeout(600)
    await expect(card).toHaveCount(1)
    await expect(card).not.toHaveClass(/crt-beam/)
    await expect(card).toHaveCSS('opacity', '1')
    await expect(page.getByTestId('tsunami-tab')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('a major tsunami warning breathes as the motion setting says, whatever the OS says', async () => {
  // It asked the OS alone: still with motion reduced there though the app said
  // full, and breathing on with motion reduced in the app.
  const cases = [
    { motion: 'reduced', os: 'no-preference', breathes: false },
    { motion: 'full', os: 'reduce', breathes: true },
  ] as const
  for (const { motion, os, breathes } of cases) {
    served[JMA_TSUNAMI] = tsunamiListing('major_VTSE41_0.json')
    served['/bosai/tsunami/data/major_VTSE41_0.json'] = tsunamiReport([['宮城県', '52', '10']])
    const { page, close } = await launch(undefined, {
      layout: single('clock'),
      settings: { ...japan({ notify: true, minIntensity: '7' }), motion },
      ...services(),
      args: ['--lang=ja'],
    })
    try {
      await page.emulateMedia({ reducedMotion: os })
      const card = page.getByTestId('tsunami-alert')
      await expect(card).toHaveAttribute('data-level', 'major', { timeout: 20_000 })
      await expect(card).toHaveCSS('animation-name', breathes ? /breathe$/ : 'none')
    } finally {
      await close()
    }
  }
})

test('the world source lists the USGS by magnitude, with a NOAA tsunami warning in the pane and the alerts', async () => {
  const now = Date.now()
  served[USGS_FEED] = JSON.stringify({
    features: [
      {
        id: 'us-big',
        properties: {
          type: 'earthquake',
          time: now - 10 * 60_000,
          mag: 6.4,
          place: `${TEST}110 miles SE of Amchitka, Alaska`,
          url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us-big',
        },
        geometry: { coordinates: [-178.5, 51.2, 20] },
      },
      {
        id: 'us-small',
        properties: {
          type: 'earthquake',
          time: now - 5 * 60_000,
          mag: 4.8,
          place: `${TEST}Fiji region`,
        },
        geometry: { coordinates: [178, -17.8, 550] },
      },
    ],
  })
  const updated = new Date(now - 8 * 60_000).toISOString().replace(/\.\d+Z$/, 'Z')
  served[NTWC_FEED] = readFileSync(
    new URL('../unit/fixtures/quakes/noaa-paaq-information.xml', import.meta.url),
    'utf8',
  )
    .replace('<strong>Category:</strong> Information', '<strong>Category:</strong> Warning')
    .replaceAll('2026-09-11T10:49:50Z', updated)
    .replaceAll('110 miles SE of Amchitka', `${TEST}110 miles SE of Amchitka`)

  const { page, close } = await launch(undefined, {
    layout: single('quakes'),
    settings: { sound: { enabled: false }, quakes: { source: 'usgs', notify: true } },
    ...services(),
    args: ['--lang=en-US'],
  })
  try {
    const rows = page.getByTestId('quake-row')
    await expect(rows).toHaveCount(2, { timeout: 20_000 })
    await expect(page.getByTestId('quakes')).toHaveAttribute('data-source', 'usgs')
    await expect(rows.nth(0).locator('.badge')).toHaveText('4.8')
    await expect(rows.nth(0)).toContainText('550 km')
    await expect(rows.nth(1)).toHaveClass(/severe/)
    await expect(page.getByTestId('quakes-alerts')).toHaveText('alerts · M6.0 and up')
    await expect(page.getByTestId('quakes-credit')).toContainText('U.S. Geological Survey')
    await expect(page.getByTestId('pane-badge')).toHaveText('tsunami')

    const strip = page.getByTestId('quakes-tsunami')
    await expect(strip).toHaveAttribute('data-level', 'warning')
    await expect(strip).toContainText('Tsunami warning')
    await expect(strip).toContainText('[TEST] 110 miles SE of Amchitka')

    // Announced: the tsunami card and the M6.4, not the M4.8.
    await expect(page.getByTestId('tsunami-alert')).toContainText(
      'Source: NOAA Tsunami Warning Centers',
    )
    await expect(page.getByTestId('tsunami-alert')).toContainText('follow local authorities')
    await expect(page.getByTestId('quake-alert')).toHaveCount(1)
    await expect(page.getByTestId('quake-alert-text')).toHaveText(
      '[TEST] 110 miles SE of Amchitka, Alaska · M6.4 · depth 20 km',
    )
    expect(requests.some((r) => r.startsWith('/bosai'))).toBe(false)
    expect(requests).toContain('/noaa/events/xml/PHEBAtom.xml')
  } finally {
    await close()
  }
})

test('a new earthquake slides in with a highlight; while scrolled down it waits behind a pill; another source brings nothing new', async () => {
  served[JMA_QUAKES] = JSON.stringify(
    Array.from({ length: 30 }, (_, i) =>
      entry(`q${i}`, 10 + i * 5, '3', ['茨城県南部', 'Southern Ibaraki Prefecture'], '4.0'),
    ),
  )
  const { app, page, close } = await launch(undefined, {
    layout: single('quakes'),
    settings: japan(),
    ...services(),
  })
  try {
    const rows = page.getByTestId('quake-row')
    await expect(rows).toHaveCount(30, { timeout: 20_000 })
    // What is listed from the start is not new.
    const fresh = page.locator('[data-testid=quakes-list] li[data-fresh]')
    expect(await fresh.count()).toBe(0)

    // Main's list, with earthquakes added to it the way a later check would.
    const state = await page.evaluate(
      () =>
        new Promise<QuakeState>((resolve) => {
          const off = window.elecdex.quakes.observe((s) => {
            off()
            resolve(s)
          })
        }),
    )
    const template = state.quakes[0] as Quake
    const quake = (id: string): Quake => ({ ...template, id, at: Date.now() })
    const publish = (next: QuakeState) =>
      app.evaluate(({ BrowserWindow }, payload) => {
        for (const win of BrowserWindow.getAllWindows())
          win.webContents.send('quakes:update', payload)
      }, next)

    let quakes = [quake('new-1'), ...state.quakes]
    await publish({ ...state, quakes })
    await expect(rows.first()).toHaveAttribute('data-id', 'new-1')
    await expect(fresh).toHaveCount(1)
    await expect(fresh.getByTestId('quake-row')).toHaveAttribute('data-id', 'new-1')
    await expect(fresh).toHaveClass(/fx-fresh/)
    // At the top, the new row is in sight: nothing to count.
    await expect(page.getByTestId('quakes-new')).toHaveCount(0)
    // The highlight lasts three seconds; then it is an ordinary row.
    await expect(fresh).toHaveCount(0, { timeout: 6000 })

    // Scrolled down: the row being read stays where it is, and a pill counts what came.
    const list = page.getByTestId('quakes-list')
    await list.evaluate((el) => {
      el.scrollTop = 240
    })
    const reading = page.locator('[data-testid=quake-row][data-id=q12]')
    const before = await reading.boundingBox()
    quakes = [quake('new-3'), quake('new-2'), ...quakes]
    await publish({ ...state, quakes })
    const pill = page.getByTestId('quakes-new')
    await expect(pill).toHaveText('↑ 2 new')
    await expect(fresh).toHaveCount(2)
    const after = await reading.boundingBox()
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(1)

    await pill.click()
    await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBe(0)
    await expect(pill).toHaveCount(0)
    await expect(rows.first()).toHaveAttribute('data-id', 'new-3')

    // Scrolling back up by hand clears the pill too.
    await list.evaluate((el) => {
      el.scrollTop = 240
    })
    quakes = [quake('new-4'), ...quakes]
    await publish({ ...state, quakes })
    await expect(pill).toHaveText('↑ 1 new')
    await list.evaluate((el) => {
      el.scrollTop = 0
    })
    await expect(pill).toHaveCount(0)

    // Another source is another list: none of it is new, and no pill carries over.
    await expect(fresh).toHaveCount(0, { timeout: 6000 })
    await list.evaluate((el) => {
      el.scrollTop = 240
    })
    await publish({ ...state, source: 'usgs', quakes: [quake('world-1'), quake('world-2')] })
    await expect(rows).toHaveCount(2)
    expect(await fresh.count()).toBe(0)
    await expect(page.getByTestId('quakes-new')).toHaveCount(0)
  } finally {
    await close()
  }
})
