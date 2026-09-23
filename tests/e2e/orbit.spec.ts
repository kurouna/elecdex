import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The ORBIT pane against a stand-in for CelesTrak serving the elements it
 * served on 2026-09-23. What only the running app can show: that main asks for
 * the stations once, and for Starlink only when the pane turns it on; that a
 * restart asks again for nothing (the copy on disk is fresh); that a refusal is
 * not asked again; that the pane works the stations' positions out and draws
 * them; and that main lets go of the sets when the pane goes.
 */

const STATIONS = readFileSync('tests/fixtures/orbits/stations.json', 'utf8')
const STARLINK = readFileSync('tests/fixtures/orbits/starlink-60.tle', 'utf8')

interface Stand {
  url: string
  asked: string[]
  status: number
  close(): Promise<void>
}

async function celestrak(): Promise<Stand> {
  const stand = { asked: [] as string[], status: 200 }
  const server: Server = createServer((req, res) => {
    const url = req.url ?? ''
    stand.asked.push(url)
    if (stand.status !== 200) {
      res.writeHead(stand.status).end('GP data has not updated since your last successful download')
      return
    }
    const starlink = url.includes('GROUP=starlink')
    res.writeHead(200, { 'content-type': starlink ? 'text/plain' : 'application/json' })
    res.end(starlink ? STARLINK : STATIONS)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return Object.assign(stand, {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  })
}

const single = (state?: Record<string, unknown>) => ({
  version: 1,
  root: { kind: 'pane', id: 'o', widget: 'orbit', ...(state ? { state } : {}) },
})

test('draws the stations from one download, and asks for Starlink only when shown', async () => {
  const stand = await celestrak()
  let launched = await launch(undefined, { layout: single(), celestrakBaseUrl: stand.url })
  try {
    const { page } = launched
    await expect(page.getByTestId('orbit-gmt')).toHaveText(/^\d{3}\/\d{2}:\d{2}:\d{2}$/)
    await expect(page.getByTestId('orbit-pos')).toHaveText(/°[NS] .*°[EW]/, { timeout: 15_000 })
    await expect(page.getByTestId('orbit-pass')).not.toHaveText('—')
    expect(stand.asked).toEqual(['/NORAD/elements/gp.php?GROUP=stations&FORMAT=json'])

    await page.locator('[data-testid="orbit-toggle"][data-toggle="starlink"]').click()
    await expect.poll(() => stand.asked.length).toBe(2)
    expect(stand.asked[1]).toContain('GROUP=starlink&FORMAT=tle')
    // The dots are drawn: a worker once left them missing where the page could not start it.
    const map = page.getByTestId('orbit-map')
    await expect
      .poll(async () => Number(await map.getAttribute('data-starlink')), { timeout: 10_000 })
      .toBe(60)

    // The ISS tells its details to the pointer.
    const marks = JSON.parse((await map.getAttribute('data-stations')) ?? '{}') as Record<
      string,
      [number, number]
    >
    const [x, y] = marks.ISS ?? [0, 0]
    await map.hover({ position: { x, y } })
    await expect(page.getByTestId('orbit-tip')).toContainText('International Space Station')
    await expect(page.getByTestId('orbit-tip')).toContainText('NORAD 25544')
    await expect(page.getByTestId('orbit-tip')).toContainText('PERIOD')
    await page.mouse.move(2, 2)
    await expect(page.getByTestId('orbit-tip')).toHaveCount(0)

    // Tiangong can be followed instead, from the same download.
    await page.locator('[data-testid="orbit-focus"][data-code="CSS"]').click()
    await expect(page.getByTestId('orbit-telemetry')).toContainText('CSS LAT / LON')

    // A restart finds both copies fresh on disk and asks for nothing.
    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('orbit-pos')).toHaveText(/°[NS]/, { timeout: 15_000 })
    await launched.page.waitForTimeout(1500)
    expect(stand.asked).toHaveLength(2)
  } finally {
    await launched.close()
    await stand.close()
  }
})

test('asks no more after a refusal, and keeps nothing once the pane is gone', async () => {
  const stand = await celestrak()
  stand.status = 403
  const { page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'split',
        id: 's',
        direction: 'row',
        sizes: [60, 40],
        children: [
          { kind: 'pane', id: 'o', widget: 'orbit' },
          { kind: 'pane', id: 'c', widget: 'clock' },
        ],
      },
    },
    celestrakBaseUrl: stand.url,
  })
  try {
    await expect(page.getByTestId('orbit')).toContainText('CelesTrak answered 403', {
      timeout: 15_000,
    })
    // Moving the pane remounts it; the refusal still stands.
    await page.reload()
    await expect(page.getByTestId('orbit')).toContainText('CelesTrak answered 403', {
      timeout: 15_000,
    })
    expect(stand.asked).toHaveLength(1)

    expect(await page.evaluate(() => window.elecdex.orbits.watching())).toEqual(['stations'])
    await page.getByTestId('pane-close').first().click()
    await expect(page.getByTestId('orbit')).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => window.elecdex.orbits.watching())).toEqual([])
  } finally {
    await close()
    await stand.close()
  }
})

test("chooses the observer from the city list, as the pane's own", async () => {
  const stand = await celestrak()
  const { page, close } = await launch(undefined, { layout: single(), celestrakBaseUrl: stand.url })
  try {
    await page.getByTestId('orbit-observer').click()
    await page.getByTestId('orbit-picker-input').fill('Reykja')
    await page.getByTestId('orbit-picker-city').first().click()
    await expect(page.getByTestId('orbit-observer')).toContainText('Reykjav')
    await expect(page.getByTestId('orbit-telemetry')).toContainText('NEXT PASS · REYKJAV')
  } finally {
    await close()
    await stand.close()
  }
})
